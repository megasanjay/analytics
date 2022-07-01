import type { NextApiRequest, NextApiResponse } from 'next'

import NextCors from 'nextjs-cors'
import validator from 'validator'
import dayjs from 'dayjs'
import requestIp from 'request-ip'

const version = require('../../../package.json').version

import clientPromise from '../../lib/mongodb'

type Data = {
  version?: string
  error?: string
}

type RequestBody = {
  uid?: string
  collection?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // Run the cors middleware
  await NextCors(req, res, {
    // Options
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    origin: '*',
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  })

  if (req.method === 'GET') {
    res.status(200).json({ version })
  }
  if (req.method === 'POST') {
    if ('body' in req) {
      const body = req.body as RequestBody

      let authorization = req.headers.authorization

      if (!authorization) {
        res.status(401).json({ error: 'authorization  is required' })
        return
      }

      if (typeof authorization === 'string') {
        authorization = authorization.trim()
      }

      // check if space in the authorization header
      if (authorization.indexOf(' ') === -1) {
        res.status(401).json({ error: 'authorization is not valid' })
        return
      }

      const token = authorization?.split(' ')[1]

      if (validator.isUUID(token, 4)) {
        res.status(401).json({ error: 'authorization is not valid' })
        return
      }

      if (!body.uid) {
        res.status(400).json({ error: 'uid is required' })
        return
      }

      if (!body.collection) {
        res.status(400).json({ error: 'collection is required' })
        return
      }

      const uid = body.uid
      const collection = body.collection

      const client = await clientPromise
      const db = client.db('analytics')

      const ipAddress = requestIp.getClientIp(req)

      // verify user

      const query = {
        uid,
      }

      const user = await db.collection('users').findOne(query)

      if (!user) {
        res.status(400)
        return
      }

      if (user.token !== token) {
        res.status(401)
        return
      }

      const data = {
        timestamp: dayjs().unix(),
        uid,
        collection,
        ipAddress,
      }

      await db.collection(collection).insertOne(data)

      res.status(201)
    } else {
      res.status(400).json({ error: 'Invalid request' })
    }
    return
  }
}
