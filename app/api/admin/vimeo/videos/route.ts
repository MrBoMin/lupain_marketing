import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/app/actions/auth"

type VimeoPicture = {
  width?: number
  height?: number
  link?: string
}

type VimeoVideo = {
  uri?: string
  name?: string
  description?: string | null
  duration?: number
  link?: string
  pictures?: {
    sizes?: VimeoPicture[]
  }
}

function getVideoId(uri?: string) {
  return uri?.split("/").filter(Boolean).pop() || ""
}

function getThumbnail(video: VimeoVideo) {
  const sizes = video.pictures?.sizes || []
  return sizes[sizes.length - 1]?.link || sizes[0]?.link || null
}

export async function GET(request: NextRequest) {
  const user = await getUser()

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const accessToken = process.env.VIMEO_ACCESS_TOKEN

  if (!accessToken) {
    return NextResponse.json(
      { error: "Vimeo access token not configured" },
      { status: 500 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const page = searchParams.get("page") || "1"
  const query = searchParams.get("query") || ""

  const vimeoParams = new URLSearchParams({
    page,
    per_page: "20",
    sort: "date",
    direction: "desc",
  })

  if (query.trim()) {
    vimeoParams.set("query", query.trim())
  }

  try {
    const response = await fetch(
      `https://api.vimeo.com/me/videos?${vimeoParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Vimeo videos" },
        { status: response.status }
      )
    }

    const data = await response.json()
    const videos = (data.data || []).map((video: VimeoVideo) => ({
      id: getVideoId(video.uri),
      title: video.name || "Untitled video",
      description: video.description || "",
      duration: video.duration || 0,
      thumbnail: getThumbnail(video),
      link: video.link || null,
    }))

    return NextResponse.json({
      videos,
      page: data.page || Number(page),
      total: data.total || videos.length,
      hasNextPage: Boolean(data.paging?.next),
    })
  } catch (error) {
    console.error("Vimeo videos API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch Vimeo videos" },
      { status: 500 }
    )
  }
}
