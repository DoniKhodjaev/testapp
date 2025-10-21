import { PrismaClient, UserRole, PaymentStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create test company
  const company = await prisma.company.upsert({
    where: { inn: '7701234567' },
    update: {},
    create: {
      name: 'ООО "Тестовая Компания"',
      inn: '7701234567',
      kpp: '770101001',
      ogrn: '1027700000000',
      status: 'ACTIVE',
      limitsJson: {
        dailyLimit: 10000000,
        singlePaymentLimit: 5000000,
      },
    },
  });
  console.log('✅ Company created:', company.name);

  // 2. Create users with different roles
  const users = [
    {
      email: 'admin@test.ru',
      password: 'Admin123!',
      role: UserRole.ADMIN,
      phone: '+79991234567',
      permissions: [
        'payments:create',
        'payments:edit',
        'payments:view',
        'payments:delete',
        'payments:sign',
        'payments:send',
        'payments:import',
        'payments:export',
        'statements:view',
        'statements:export',
        'vkdocs:upload',
        'vkdocs:view',
        'messages:view',
        'messages:reply',
        'users:manage',
        'audit:view',
        'audit:export',
      ],
    },
    {
      email: 'operator@test.ru',
      password: 'Oper123!',
      role: UserRole.OPERATOR,
      phone: '+79991234568',
      permissions: [
        'payments:create',
        'payments:edit',
        'payments:view',
        'payments:import',
        'payments:export',
        'statements:view',
        'vkdocs:upload',
        'vkdocs:view',
        'messages:view',
        'messages:reply',
      ],
    },
    {
      email: 'signer@test.ru',
      password: 'Sign123!',
      role: UserRole.SIGNER,
      phone: '+79991234569',
      permissions: [
        'payments:view',
        'payments:sign',
        'payments:send',
        'statements:view',
        'messages:view',
      ],
    },
    {
      email: 'viewer@test.ru',
      password: 'View123!',
      role: UserRole.VIEWER,
      phone: '+79991234570',
      permissions: ['payments:view', 'statements:view', 'messages:view'],
    },
  ];

  for (const userData of users) {
    const passwordHash = await argon2.hash(userData.password);

    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        companyId: company.id,
        email: userData.email,
        passwordHash,
        phone: userData.phone,
        role: userData.role,
        permissions: userData.permissions,
        mfaEnabled: false,
        isActive: true,
        limitsJson: {
          dailyLimit: 1000000,
          singlePaymentLimit: 500000,
        },
      },
    });
    console.log(`✅ User created: ${userData.email} (${userData.role})`);
  }

  // 3. Create test accounts
  const account = await prisma.account.create({
    data: {
      companyId: company.id,
      accountNo: '40702810000000000001',
      bic: '044525225',
      bankName: 'ПАО "Тестовый Банк"',
      currency: 'RUB',
      balance: 1000000.0,
      isActive: true,
    },
  });
  console.log('✅ Account created:', account.accountNo);

  // 4. Create test counterparties
  const counterparties = [
    {
      name: 'ООО "Ромашка"',
      inn: '7702123456',
      kpp: '770201001',
      accountNo: '40702810100000000002',
      bic: '044525226',
    },
    {
      name: 'АО "Василек"',
      inn: '7703234567',
      kpp: '770301001',
      accountNo: '40702810200000000003',
      bic: '044525227',
    },
    {
      name: 'ИП Иванов Иван Иванович',
      inn: '770412345678',
      kpp: null,
      accountNo: '40802810300000000004',
      bic: '044525228',
    },
  ];

  const createdCounterparties = [];
  for (const cp of counterparties) {
    const created = await prisma.counterparty.create({
      data: {
        companyId: company.id,
        ...cp,
      },
    });
    createdCounterparties.push(created);
    console.log('✅ Counterparty created:', cp.name);
  }

  // 5. Create sample payments
  const operator = await prisma.user.findFirst({
    where: { email: 'operator@test.ru' },
  });

  const samplePayments = [
    {
      date: new Date('2025-10-15'),
      amount: 15000.5,
      purpose: 'Оплата по счету №123 от 10.10.2025, без НДС',
      status: PaymentStatus.DRAFT,
    },
    {
      date: new Date('2025-10-16'),
      amount: 25000.0,
      purpose: 'Оплата за услуги по договору №456, в т.ч. НДС 20%',
      status: PaymentStatus.ON_APPROVAL,
    },
    {
      date: new Date('2025-10-17'),
      amount: 50000.0,
      purpose: 'Предоплата за товар по счету №789',
      status: PaymentStatus.SIGNED,
    },
  ];

  for (let i = 0; i < samplePayments.length; i++) {
    const paymentData = samplePayments[i];
    const cp = createdCounterparties[i % createdCounterparties.length];

    await prisma.payment.create({
      data: {
        companyId: company.id,
        accountId: account.id,
        counterpartyId: cp.id,
        docNumber: `ПП-${1000 + i}`,
        date: paymentData.date,
        amount: paymentData.amount,
        currency: 'RUB',
        receiverName: cp.name,
        receiverInn: cp.inn,
        receiverKpp: cp.kpp,
        receiverAccount: cp.accountNo,
        receiverBic: cp.bic,
        purpose: paymentData.purpose,
        priority: 5,
        status: paymentData.status,
        createdBy: operator.id,
      },
    });
    console.log(`✅ Payment created: ${paymentData.purpose}`);
  }

  // 6. Create sample messages
  await prisma.message.create({
    data: {
      companyId: company.id,
      threadType: 'GENERAL',
      subject: 'Добро пожаловать в систему Банк-Клиент',
      body: 'Здравствуйте! Ваша компания успешно подключена к системе дистанционного банковского обслуживания. Вы можете создавать платежи, запрашивать выписки и управлять документами.',
      isFromBank: true,
      isRead: false,
    },
  });

  await prisma.message.create({
    data: {
      companyId: company.id,
      threadType: 'VK_DOCUMENT',
      subject: 'Требуется предоставить дополнительные документы',
      body: 'По платежу ПП-1001 требуется предоставить договор и счет-фактуру для валютного контроля.',
      isFromBank: true,
      isRead: false,
    },
  });

  console.log('✅ Messages created');

  console.log('\n✨ Seeding completed!\n');

  console.log('📋 Test credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Company: ООО "Тестовая Компания"');
  console.log('INN: 7701234567');
  console.log('Account: 40702810000000000001');
  console.log('Balance: 1,000,000.00 RUB');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:    admin@test.ru    / Admin123!');
  console.log('Operator: operator@test.ru / Oper123!');
  console.log('Signer:   signer@test.ru   / Sign123!');
  console.log('Viewer:   viewer@test.ru   / View123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
