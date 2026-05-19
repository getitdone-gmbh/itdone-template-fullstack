import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from 'react-oidc-context'
import { WebStorageStateStore } from 'oidc-client-ts'
import App from './App'
import { fetchAppConfig } from './api/client'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
})

async function bootstrap() {
  const root = createRoot(document.getElementById('root')!)

  try {
    const config = await fetchAppConfig()

    if (!config.issuer || !config.clientId) {
      root.render(
        <StrictMode>
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <p className="text-gray-700">OIDC is not configured on the backend.</p>
          </div>
        </StrictMode>,
      )
      return
    }

    const oidcConfig = {
      authority: config.issuer,
      client_id: config.clientId,
      redirect_uri: window.location.origin + '/callback',
      post_logout_redirect_uri: window.location.origin,
      scope: 'openid profile email',
      userStore: new WebStorageStateStore({ store: window.localStorage }),
      onSigninCallback: () => {
        window.history.replaceState({}, document.title, '/')
      },
    }

    root.render(
      <StrictMode>
        <AuthProvider {...oidcConfig}>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </AuthProvider>
      </StrictMode>,
    )
  } catch (err) {
    console.error(err)
    root.render(
      <StrictMode>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <p className="text-red-600">Failed to load app configuration.</p>
        </div>
      </StrictMode>,
    )
  }
}

bootstrap()
