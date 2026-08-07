import { useState } from 'react'
import { InputPage } from './pages/InputPage'
import { Dashboard } from './pages/Dashboard'
import type { BirthData } from './core/birth'

type Route =
  | { name: 'input' }
  | { name: 'dashboard'; birthData: BirthData }

function App() {
  const [route, setRoute] = useState<Route>({ name: 'input' })

  if (route.name === 'dashboard') {
    return (
      <Dashboard
        birthData={route.birthData}
        onReset={() => setRoute({ name: 'input' })}
      />
    )
  }

  return (
    <InputPage onSubmit={(birthData) => setRoute({ name: 'dashboard', birthData })} />
  )
}

export default App
