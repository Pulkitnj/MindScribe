import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'

const app = new Hono<{
	Bindings: {
		DATABASE_URL: string,
		JWT_SECRET: string,
	}
}>();

app.use('/api/v1/blog/*', async (c, next) => {
  //Different ways to get the token
  const header = c.req.header('Authorization') || '';
  const token = header.split(' ')[1];

  const res = await verify(token, c.env.JWT_SECRET);

  if(res.id){
    await next();
  }
  else{
    c.status(403);
    return c.json({ error: "Unauthorized" });
  }
})

app.post('/api/v1/user/signup', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
}).$extends(withAccelerate());

const body = await c.req.json();

const user = await prisma.user.create({
    data: {
        email: body.email,
        password: body.password,
    },
})

const token = await sign({id: user.id}, c.env.JWT_SECRET);

  return c.json({
    jwt: token
  })
})

app.post('/api/v1/user/signin', async (c) => {

  const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

  const body = await c.req.json();

  const user = await prisma.user.findUnique({
    where: {
      email: body.email
    }
  })

  if (!user) {
		c.status(403);
		return c.json({ error: "user not found" });
	}

  if (user.password !== body.password) {
    return c.json({
      message: 'Invalid email or password'
    })
  }

  const token = await sign({id: user.id}, c.env.JWT_SECRET);

  return c.json({
    jwt: token
  })

  return c.text('Hello Hono!')
})

app.post('/api/v1/blog', (c) => {
  return c.text('Hello Hono!')
})

app.put('/api/v1/blog', (c) => {
  return c.text('Hello Hono!')
})

app.get('/api/v1/blog/:id', (c) => {
  return c.text('Hello Hono!')
})

export default app
