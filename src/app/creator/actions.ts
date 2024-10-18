"use server"

type PostArgs = {
    isPublic: boolean
    mediaUrl: string
    mediaType: string
    text: string
}

export async function createPostAction({isPublic, mediaUrl, mediaType, text}: PostArgs) {
    const {getuser} = getKindeServerSession()
    const user = await getUser()

    const newPost = await prisma.post.create({
        data: {
            isPublic,
            mediaUrl,
            mediaType,
            text,
            authorId: user.id
        }
    })

    return {success: true, post: newPost}
    
}
