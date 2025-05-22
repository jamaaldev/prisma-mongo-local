const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const newPost = await prisma.post.create({
    data: {
      title: 'Test Post',
      body: 'Running Prisma with MongoDB on Windows!',
    },
  });

  console.log('Created:', newPost);

  const posts = await prisma.post.findMany();
  console.log('All posts:', posts);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
