import { useState } from 'react'
import { InputPage } from './pages/InputPage'
import { Dashboard } from './pages/Dashboard'
import { Report } from './pages/Report'
import { Collection } from './pages/Collection'
import type { BirthData } from './core/birth'

type Route =
  | { name: 'input' }
  | { name: 'dashboard'; birthData: BirthData }
  | { name: 'report'; birthData: BirthData }
  | { name: 'collection' }

function App() {
  const [route, setRoute] = useState<Route>({ name: 'input' })

  if (route.name === 'dashboard') {
    return (
      <Dashboard
        birthData={route.birthData}
        onReset={() => setRoute({ name: 'input' })}
        onOpenReport={() => setRoute({ name: 'report', birthData: route.birthData })}
        onOpenCollection={() => setRoute({ name: 'collection' })}
      />
    )
  }

  if (route.name === 'report') {
    return (
      <Report
        birthData={route.birthData}
        onBack={() => setRoute({ name: 'dashboard', birthData: route.birthData })}
      />
    )
  }

  if (route.name === 'collection') {
    return (
      <Collection
        onOpen={(birthData) => setRoute({ name: 'dashboard', birthData })}
        onNew={() => setRoute({ name: 'input' })}
      />
    )
  }

  return (
    <InputPage onSubmit={(birthData) => setRoute({ name: 'dashboard', birthData })} />
  )
}

export default App
