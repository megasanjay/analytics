import clientPromise from '../../../lib/mongodb'

const func = async (_req, res) => {
  //   const { db } = await clientPromise()

  const client = await clientPromise

  const db = client.db(`sample_mflix`)

  const movies = await db
    .collection('movies')
    .find({})
    .sort({ metacritic: -1 })
    .limit(20)
    .toArray()

  res.json(movies)
}

export default func
