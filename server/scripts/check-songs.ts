import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../..', '.env.server') })

async function checkSongs() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hsa-songbook'
    console.log('Connecting to:', mongoUri.replace(/\/\/.*@/, '//<credentials>@'))
    
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB')
    
    const songsCollection = mongoose.connection.db.collection('songs')
    const count = await songsCollection.countDocuments()
    console.log(`\nTotal songs in database: ${count}`)
    
    if (count > 0) {
      const songs = await songsCollection.find({}).limit(5).toArray()
      console.log('\nFirst 5 songs:')
      songs.forEach(song => {
        console.log(`  - ${song.title} by ${song.artist}`)
      })
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await mongoose.disconnect()
  }
}

checkSongs()