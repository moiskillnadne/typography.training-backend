export interface User {
    email: string
    token: string
    isConfirm: boolean
}

export interface LessonsBoughtByUser {
    user: User
    lessons: Array<Lesson>
}

export interface Lesson {
    name: LessonName
    isBought: boolean
}

export type LessonName = 'ALL_THEMES' | 'INSIDE_AND_OUTSIDE' | 'TEXT_LAYOUT' | 'ANCHOR_OBJECTS' | 'MODULES'