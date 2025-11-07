import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
  })

  // Create sample shopkeeper
  const shopkeeper = await prisma.user.upsert({
    where: { email: 'shopkeeper@example.com' },
    update: {},
    create: {
      email: 'shopkeeper@example.com',
      name: 'John Shopkeeper',
      role: 'SHOPKEEPER',
    },
  })

  // Create sample customer
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      name: 'Jane Customer',
      role: 'CUSTOMER',
    },
  })

  // Create sample shop
  const shop = await prisma.shop.upsert({
    where: { id: 'sample-shop-1' },
    update: {},
    create: {
      id: 'sample-shop-1',
      name: 'Fresh Grocery Store',
      description: 'Your neighborhood fresh grocery store',
      address: '123 Main Street, City, State',
      latitude: 40.7128,
      longitude: -74.0060,
      phone: '+1-555-0123',
      email: 'info@freshgrocery.com',
      status: 'APPROVED',
      ownerId: shopkeeper.id,
    },
  })

  // Create sample products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'product-1' },
      update: {},
      create: {
        id: 'product-1',
        name: 'Fresh Apples',
        description: 'Crisp and juicy red apples',
        price: 2.99,
        quantity: 50,
        category: 'Fruits',
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        shopId: shop.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-2' },
      update: {},
      create: {
        id: 'product-2',
        name: 'Organic Milk',
        description: 'Fresh organic whole milk',
        price: 4.99,
        quantity: 30,
        category: 'Dairy',
        expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        shopId: shop.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-3' },
      update: {},
      create: {
        id: 'product-3',
        name: 'Whole Wheat Bread',
        description: 'Fresh baked whole wheat bread',
        price: 3.49,
        quantity: 20,
        category: 'Bakery',
        expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        shopId: shop.id,
      },
    }),
  ])

  console.log('✅ Database seeded successfully!')
  console.log('Created:')
  console.log(`- Admin user: ${admin.email}`)
  console.log(`- Shopkeeper: ${shopkeeper.email}`)
  console.log(`- Customer: ${customer.email}`)
  console.log(`- Shop: ${shop.name}`)
  console.log(`- Products: ${products.length} items`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
