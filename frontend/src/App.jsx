import ItemList from './components/ItemList'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-blue-600">
            InFlashStory - Sistem Inventaris QR Code
          </h1>
        </div>
      </nav>
      <ItemList />
    </div>
  )
}

export default App