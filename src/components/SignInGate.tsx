import { type ReactNode } from 'react'
import { type AuthState } from '../hooks/useAuth'

interface SignInGateProps {
  auth: AuthState
  children: ReactNode
}

export function SignInGate({ auth, children }: SignInGateProps) {
  if (auth.loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!auth.user) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accountability</h1>
          <p className="text-gray-600 mb-6">Sign in to track your university attendance.</p>
          <button
            onClick={auth.signIn}
            className="w-full bg-app-blue text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  if (!auth.isAuthorized) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            Your email ({auth.user.email}) is not authorized to use this app.
          </p>
          <button
            onClick={auth.signOut}
            className="text-app-blue underline hover:text-blue-700"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
