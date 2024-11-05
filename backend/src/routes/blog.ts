import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { verify } from 'hono/jwt'

export const blogRouter = new Hono<{
	Bindings: {
		DATABASE_URL: string,
		JWT_SECRET: string,
	},
    Variables: {
        userId: string;
    }
}>();

blogRouter.use("/*", async (c, next) => {
    const authHeader = c.req.header("Authorization") || "";
    const user = await verify(authHeader, c.env.JWT_SECRET) ;
    if(user) {
        //@ts-ignore
        c.set("userId", user.id);
        await next();
    }else{
        c.status(403);
        return c.json({
            error: "Unauthorized"
        })
    }
});


blogRouter.post('/', async (c) => {
    const userId = c.get('userId');
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	const body = await c.req.json();

	try{
		const post = await prisma.post.create({
			data: {
				title: body.title,
				content: body.content,
				authorId: Number(userId)
			}
		});
		return c.json({
			id: post.id
		});
	}
	catch(e){
		console.error(e);
		return c.json({
			error: "Internal Server Error"
		});
	}
	
})
  
blogRouter.put('/',async (c) => {
    const userId = c.get('userId');
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	const body = await c.req.json();
	const post = await prisma.post.update({
		where: {
			id: body.id,
			authorId: Number(userId)
		},
		data: {
			title: body.title,
			content: body.content
		}
	});

	return c.json({
		id: post.id,
		message: "Post updated"
	})
})

blogRouter.get('/bulk',async (c) => {
    const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());
	
	try {
        const posts = await prisma.post.findMany();
        return c.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error); // Log the error for debugging
        return c.json({ error: "Internal Server Error" });
    }
})
  
blogRouter.get('/:id', async (c) => {
    const id = c.req.param('id');
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    try {
        const post = await prisma.post.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!post) {
            return c.json({ error: "Post not found" });
        }

        return c.json({ post });
    } catch (error) {
        console.error('Error fetching post:', error); // Log the error for debugging
        return c.json({ error: "Internal Server Error" });
    }
});
