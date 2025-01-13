import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI

if (!uri) {
  throw new Error('Please add your Mongo URI to .env')
}

export async function connectToMongo() {
  const client = await MongoClient.connect(uri)
  return client
}