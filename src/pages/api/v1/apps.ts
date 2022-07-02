import type { NextApiRequest, NextApiResponse } from 'next'

import { v4 as uuidv4 } from 'uuid'
import sanitize from 'mongo-sanitize'

import clientPromise from '../../../lib/mongodb'

type Data = {
  name?: string
  aid?: string
  error?: string
}

type RequestBody = {
  name: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'GET') {
    const query = req.query as {
      aid?: string
    }

    const aid = sanitize(query.aid)

    if (!aid) {
      res.status(400).json({ error: 'aid is required' })
      return
    }

    const client = await clientPromise
    const db = client.db('meta')

    // get app object

    const app = await db
      .collection('apps')
      .findOne({ aid }, { projection: { _id: 0 } })

    if (!app) {
      res.status(404).json({ error: 'Requested app not found' })
      return
    } else {
      res.status(200).json(app)
      return
    }
  } else if (req.method === 'POST') {
    if ('body' in req) {
      const body = req.body as RequestBody

      if (!body.name) {
        res.status(400).json({ error: 'name is required' })
        return
      }

      const appName = sanitize(body.name)

      const client = await clientPromise
      const db = client.db('meta')

      const data = {
        name: appName,
        aid: uuidv4(),
      }

      // insert app
      await db.collection('apps').insertOne(data)

      res.status(201).json(data)
      return
    }
  } else if (req.method === 'DELETE') {
    if ('body' in req) {
      const body = req.body as RequestBody

      if (!body.name) {
        res.status(400).json({ error: 'name is required' })
        return
      }

      const appName = sanitize(body.name)

      const client = await clientPromise
      const db = client.db('meta')

      const query = {
        name: appName,
      }

      // delete app
      await db.collection('apps').deleteOne(query)

      res.status(204).end()
      return
    }
  }
}
