import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample teams (optional)
  const sampleTeam = await prisma.team.upsert({
    where: { inviteCode: 'SAMPLE001' },
    update: {},
    create: {
      name: 'Sample Development Team',
      description: 'A sample team for testing purposes',
      inviteCode: 'SAMPLE001',
      settings: {
        publicLeaderboard: true,
        allowInvites: true
      }
    }
  });

  console.log('✅ Created sample team:', sampleTeam.name);

  // Note: User profiles are created when users register through Supabase Auth
  // No need to seed user data here

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 