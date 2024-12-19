import { seedDatabase } from '../../utils/seeds';

async function handler(req, res) {
console.log(req,res,'sebah')
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await seedDatabase();
    res.status(200).json({ message: 'Database seeded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error seeding database', error: error.message });
  }
}
export default handler