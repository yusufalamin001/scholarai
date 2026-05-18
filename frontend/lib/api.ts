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

export async function generateQuiz(courseId: string, topic: string, numQuestions: number) {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/quiz/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ course_id: courseId, topic, num_questions: numQuestions })
  })
  if (!res.ok) throw new Error('Failed to generate quiz')
  return res.json()
}

export async function submitQuiz(courseId: string, topic: string, score: number, total: number) {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/quiz/submit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ course_id: courseId, topic, score, total })
  })
  if (!res.ok) throw new Error('Failed to submit quiz')
  return res.json()
}

export interface Room {
  id: string
  name: string
  course_id: string
  created_by: string
  invite_code: string
  created_at: string
}

export async function getRooms(): Promise<Room[]> {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/rooms/`, { headers })
  if (!res.ok) throw new Error('Failed to fetch rooms')
  return res.json()
}

export async function createRoom(name: string, courseId: string): Promise<Room> {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/rooms/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, course_id: courseId })
  })
  if (!res.ok) throw new Error('Failed to create room')
  return res.json()
}

export async function joinRoomByCode(inviteCode: string): Promise<{ room: Room }> {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/rooms/join-by-code`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ invite_code: inviteCode })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Failed to join room')
  }
  return res.json()
}

export async function deleteRoom(roomId: string): Promise<void> {
  const headers = await getHeaders()
  await fetch(`${API_URL}/rooms/${roomId}`, { method: 'DELETE', headers })
}

export async function queryRoom(
  roomId: string,
  question: string
): Promise<{ answer: string; sources: any[] }> {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/rooms/${roomId}/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ question })
  })
  if (!res.ok) throw new Error('Failed to query room AI')
  return res.json()
}

export async function generatePlan(
  courses: Array<{ name: string; code: string }>,
  examDate: string,
  targetCgpa: number
) {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/planner/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ courses, exam_date: examDate, target_cgpa: targetCgpa })
  })
  if (!res.ok) throw new Error('Failed to generate plan')
  return res.json()
}

export async function updateProfile(data: {
  full_name?: string
  faculty?: string
  university?: string
  avatar_url?: string
}) {
  const headers = await getHeaders()
  const res = await fetch(`${API_URL}/auth/profile`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to update profile')
  return res.json()
}