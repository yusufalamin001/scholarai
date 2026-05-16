import { createClient } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function getHeaders(): Promise<HeadersInit> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || ''}`
  }
}

export interface Course {
  id: string
  user_id: string
  name: string
  course_code: string
  faculty: string
  created_at: string
  documents?: CourseDocument[]
}

export interface CourseDocument {
  id: string
  course_id: string
  user_id: string
  name: string
  storage_path: string
  size_bytes: number
  status: 'processing' | 'ready' | 'error'
  created_at: string
}

export interface ProgressSummary {
  total_courses: number
  total_interactions: number
  courses: {
    course_id: string
    course_name: string
    course_code: string
    total_interactions: number
    topics_covered: number
  }[]
}

export async function fetchCourses(): Promise<Course[]> {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/courses/`, { headers })
  if (!res.ok) throw new Error('Failed to fetch courses')
  return res.json()
}

export async function createCourse(data: {
  name: string
  course_code: string
  faculty: string
}): Promise<Course> {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/courses/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to create course')
  return res.json()
}

export async function getCourse(id: string): Promise<Course> {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/courses/${id}`, { headers })
  if (!res.ok) throw new Error('Failed to fetch course')
  return res.json()
}

export async function deleteCourse(id: string): Promise<void> {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/courses/${id}`, { method: 'DELETE', headers })
  if (!res.ok) throw new Error('Failed to delete course')
}

export async function uploadDocument(courseId: string, file: File): Promise<CourseDocument> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_URL}/documents/${courseId}/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session?.access_token || ''}` },
    body: formData
  })
  if (!res.ok) throw new Error('Failed to upload document')
  return res.json()
}

export async function deleteDocument(docId: string): Promise<void> {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/documents/${docId}`, { method: 'DELETE', headers })
  if (!res.ok) throw new Error('Failed to delete document')
}

export async function getProgressSummary(): Promise<ProgressSummary> {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/progress/summary`, { headers })
  if (!res.ok) throw new Error('Failed to fetch progress')
  return res.json()
}

export async function queryAI(
  courseId: string,
  question: string
): Promise<{ answer: string; sources: any[] }> {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/query/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ course_id: courseId, question })
  })
  if (!res.ok) throw new Error('Failed to get AI response')
  return res.json()
}

export async function getCourseProgress(courseId: string) {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/progress/${courseId}`, { headers })
  if (!res.ok) throw new Error('Failed to fetch course progress')
  return res.json()
}