import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Workflows = lazy(() => import('./pages/Workflows'))
const WorkflowEditor = lazy(() => import('./pages/WorkflowEditor'))
const Executions = lazy(() => import('./pages/Executions'))
const Templates = lazy(() => import('./pages/Templates'))
const Credentials = lazy(() => import('./pages/Credentials'))
const Datasets = lazy(() => import('./pages/Datasets'))
const Models = lazy(() => import('./pages/Models'))
const AutoML = lazy(() => import('./pages/AutoML'))
const Projects = lazy(() => import('./pages/Projects'))
const AIAgent = lazy(() => import('./pages/AIAgent'))
const UsageAnalytics = lazy(() => import('./pages/UsageAnalytics'))
const Vectors = lazy(() => import('./pages/Vectors'))
const UIDevelopment = lazy(() => import('./pages/UIDevelopment'))
const UIBuilder = lazy(() => import('./pages/UIBuilder'))
const Databases = lazy(() => import('./pages/Databases'))
const Settings = lazy(() => import('./pages/Settings'))
const EmbedAgent = lazy(() => import('./pages/EmbedAgent'))
const PublishedUI = lazy(() => import('./pages/PublishedUI'))

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function Loading() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/embed/agents/:id" element={<Suspense fallback={<Loading />}><EmbedAgent /></Suspense>} />
      <Route path="/p/:publicId" element={<Suspense fallback={<Loading />}><PublishedUI /></Suspense>} />
      <Route path="/ui-development/:id" element={<ProtectedRoute><Suspense fallback={<Loading />}><UIBuilder /></Suspense></ProtectedRoute>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Suspense fallback={<Loading />}><Dashboard /></Suspense>} />
        <Route path="workflows" element={<Suspense fallback={<Loading />}><Workflows /></Suspense>} />
        <Route path="workflows/:id" element={<Suspense fallback={<Loading />}><WorkflowEditor /></Suspense>} />
        <Route path="executions" element={<Suspense fallback={<Loading />}><Executions /></Suspense>} />
        <Route path="projects" element={<Suspense fallback={<Loading />}><Projects /></Suspense>} />
        <Route path="agents" element={<Suspense fallback={<Loading />}><AIAgent /></Suspense>} />
        <Route path="datasets" element={<Suspense fallback={<Loading />}><Datasets /></Suspense>} />
        <Route path="automl" element={<Suspense fallback={<Loading />}><AutoML /></Suspense>} />
        <Route path="databases" element={<Suspense fallback={<Loading />}><Databases /></Suspense>} />
        <Route path="models" element={<Suspense fallback={<Loading />}><Models /></Suspense>} />
        <Route path="vectors" element={<Suspense fallback={<Loading />}><Vectors /></Suspense>} />
        <Route path="ui-development" element={<Suspense fallback={<Loading />}><UIDevelopment /></Suspense>} />
        <Route path="usage" element={<Suspense fallback={<Loading />}><UsageAnalytics /></Suspense>} />
        <Route path="templates" element={<Suspense fallback={<Loading />}><Templates /></Suspense>} />
        <Route path="credentials" element={<Suspense fallback={<Loading />}><Credentials /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<Loading />}><Settings /></Suspense>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
