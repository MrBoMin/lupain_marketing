import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params
  
  const accessToken = process.env.VIMEO_ACCESS_TOKEN

  if (!accessToken) {
    return NextResponse.json(
      { error: "Vimeo access token not configured" },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(`https://api.vimeo.com/videos/${videoId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Video not found" },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: "Failed to fetch video info" },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      id: videoId,
      title: data.name,
      description: data.description,
      duration: data.duration, // in seconds
      thumbnail: data.pictures?.sizes?.[3]?.link || data.pictures?.sizes?.[0]?.link,
      width: data.width,
      height: data.height,
    })
  } catch (error) {
    console.error("Vimeo API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch video info" },
      { status: 500 }
    )
  }
}


