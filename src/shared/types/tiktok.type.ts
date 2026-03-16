export interface IGetAwemeListCursor {
  cursor: string
  maxCursor: string
}

export interface ITiktokVideo {
  coverUri: string
  mp4Uri: string
}

export interface ITiktokAwemeItemStats {
  likes: number
  comments: number
  shares: number
  views: number
  collects: number
}

export interface IAwemeDetails {
  id: string
  url: string
  description: string
  createdAt: number
  type: 'PHOTO' | 'VIDEO'
  stats: ITiktokAwemeItemStats
  video?: ITiktokVideo
  imagesUri?: string[]
  musicUri?: string
}

export interface IAwemeListResponse {
  awemeList: IAwemeDetails[]
  pagination: IGetAwemeListCursor & {
    hasMore: boolean
  }
}

export interface IUserInfo {
  id: string
  uniqueId: string
  secUid: string
  followerCount: number
  followingCount: number
  avatarUri: string
}
