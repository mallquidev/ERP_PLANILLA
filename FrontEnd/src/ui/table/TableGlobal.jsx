import React, { useState, useMemo } from 'react'
import {
  TrashIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import ModalGlobal from '../modal/ModalGlobal'

function TableGlobal({
  data = [],
  columns = [],
  modalColumns = [],
  title = "Table",
  onCreate,
  onUpdate,
  onDelete
}) {

  const ITEMS_PER_PAGE = 5
  const MAX_VISIBLE_PAGES = 5

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [modalType, setModalType] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [formData, setFormData] = useState({})

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return []

    return data.filter(item =>
      columns.some(col =>
        String(item[col.key] ?? '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    )
  }, [data, searchTerm, columns])

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const showingFrom = filteredData.length === 0 ? 0 : startIndex + 1
  const showingTo = Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)

  const getVisiblePages = () => {
    let start = Math.max(1, currentPage - 2)
    let end = start + MAX_VISIBLE_PAGES - 1

    if (end > totalPages) {
      end = totalPages
      start = Math.max(1, end - MAX_VISIBLE_PAGES + 1)
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const handleAdd = () => {
    setFormData({})
    setSelectedItem(null)
    setModalType('add')
  }

  const handleEdit = (item) => {
    setFormData(item)
    setSelectedItem(item)
    setModalType('edit')
  }

  const handleDelete = (item) => {
    setSelectedItem(item)
    setModalType('delete')
  }

  const handleSave = async () => {
    if (modalType === 'add' && onCreate) await onCreate(formData)
    if (modalType === 'edit' && onUpdate) await onUpdate(formData)
    closeModal()
  }

  const handleConfirmDelete = async () => {
    if (onDelete && selectedItem) await onDelete(selectedItem)
    closeModal()
  }

  const closeModal = () => {
    setModalType(null)
    setSelectedItem(null)
  }

  return (
    <div className="bg-white rounded-xl w-full">

      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-slate-900">
          {title}
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition"
        >
          <PlusIcon className="w-5 h-5" />
          Agregar
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg">
        <div className="w-full overflow-x-auto">
          <table className="min-w-max w-full text-sm">
            <thead className="bg-slate-100 border-b">
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    className="px-6 py-4 text-left font-semibold text-slate-900 whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-6 py-4 font-semibold whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((item, index) => (
                <tr
                  key={item.PKID || item.id}
                  className={`border-b hover:bg-slate-50 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  }`}
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className="px-6 py-4 whitespace-nowrap text-slate-700"
                    >
                      {col.render
                        ? col.render(item)
                        : col.displayKey
                          ? (col.options.find(opt => opt.PKID === item[col.key])?.[col.displayKey] ?? '')
                          : item[col.key]}
                    </td>
                  ))}

                  <td className="px-6 py-4 flex gap-2 whitespace-nowrap">
                    <button
                      onClick={() => handleEdit(item)}
                      className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => handleDelete(item)}
                      className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 space-y-4">

          <div className="text-sm text-slate-600">
            Mostrando {showingFrom}-{showingTo} de {filteredData.length}
          </div>

          <div className="flex justify-center items-center gap-2 flex-wrap">

            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-2 rounded-lg border disabled:opacity-40"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            {getVisiblePages().map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg font-semibold transition ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border hover:border-blue-500'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-2 rounded-lg border disabled:opacity-40"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>

          </div>
        </div>
      )}

      <ModalGlobal
        modalType={modalType}
        formData={formData}
        setFormData={setFormData}
        onClose={closeModal}
        onSave={handleSave}
        columns={modalColumns.length > 0 ? modalColumns : columns}
      />

      {modalType === 'delete' && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold mb-4">
              Confirmar si quieres eliminar
            </h3>

            <p className="mb-6">
              Estas seguro de Eliminar?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Eliminar
              </button>

              <button
                onClick={closeModal}
                className="px-4 py-2 border rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default TableGlobal