import React, { useState, useMemo } from 'react'
import { 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

function TableUi() {
  const ITEMS_PER_PAGE = 5
  
  const [members, setMembers] = useState([
    {
      id: 1,
      name: 'John Michael',
      email: 'john@creative-tim.com',
      function: 'Manager',
      organization: 'Organization',
      status: 'ONLINE',
      employed: '23/04/18'
    },
    {
      id: 2,
      name: 'Alexa Liras',
      email: 'alexa@creative-tim.com',
      function: 'Programator',
      organization: 'Developer',
      status: 'OFFLINE',
      employed: '23/04/18'
    },
    {
      id: 3,
      name: 'Laurent Perrier',
      email: 'laurent@creative-tim.com',
      function: 'Executive',
      organization: 'Projects',
      status: 'OFFLINE',
      employed: '19/09/17'
    },
    {
      id: 4,
      name: 'Michael Levi',
      email: 'michael@creative-tim.com',
      function: 'Programator',
      organization: 'Developer',
      status: 'ONLINE',
      employed: '24/12/08'
    },
    {
      id: 5,
      name: 'Richard Gran',
      email: 'richard@creative-tim.com',
      function: 'Manager',
      organization: 'Executive',
      status: 'OFFLINE',
      employed: '04/10/21'
    },
    {
      id: 6,
      name: 'Sarah Connor',
      email: 'sarah@creative-tim.com',
      function: 'Designer',
      organization: 'UI/UX',
      status: 'ONLINE',
      employed: '15/03/20'
    },
    {
      id: 7,
      name: 'James Wilson',
      email: 'james@creative-tim.com',
      function: 'Developer',
      organization: 'Backend',
      status: 'OFFLINE',
      employed: '08/07/19'
    },
    {
      id: 8,
      name: 'Emma Davis',
      email: 'emma@creative-tim.com',
      function: 'Product Manager',
      organization: 'Product',
      status: 'ONLINE',
      employed: '22/01/21'
    },
    {
      id: 9,
      name: 'Thomas Brown',
      email: 'thomas@creative-tim.com',
      function: 'QA Engineer',
      organization: 'Testing',
      status: 'OFFLINE',
      employed: '10/06/18'
    },
    {
      id: 10,
      name: 'Lisa Anderson',
      email: 'lisa@creative-tim.com',
      function: 'Analyst',
      organization: 'Analytics',
      status: 'ONLINE',
      employed: '30/11/20'
    },
    {
      id: 11,
      name: 'Mark Taylor',
      email: 'mark@creative-tim.com',
      function: 'Manager',
      organization: 'Operations',
      status: 'ONLINE',
      employed: '14/05/19'
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [modalType, setModalType] = useState(null) // 'edit', 'delete', 'add', null
  const [selectedMember, setSelectedMember] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    function: '',
    organization: '',
    status: 'ONLINE',
    employed: ''
  })

  // Filtrar miembros por búsqueda - Los nuevos miembros primero
  const filteredMembers = useMemo(() => {
    return members
      .filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .reverse()
  }, [members, searchTerm])

  // Calcular paginación
  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Abrir modal de edición
  const handleEdit = (member) => {
    setSelectedMember(member)
    setFormData({ ...member })
    setModalType('edit')
  }

  // Abrir modal de eliminación
  const handleDeleteClick = (member) => {
    setSelectedMember(member)
    setModalType('delete')
  }

  // Abrir modal de agregar
  const handleAddMember = () => {
    setSelectedMember(null)
    setFormData({
      name: '',
      email: '',
      function: '',
      organization: '',
      status: 'ONLINE',
      employed: ''
    })
    setModalType('add')
  }

  // Guardar cambios en edición
  const handleSaveEdit = () => {
    setMembers(members.map(m => m.id === formData.id ? formData : m))
    setCurrentPage(1)
    setModalType(null)
    setSelectedMember(null)
  }

  // Guardar nuevo miembro
  const handleSaveAdd = () => {
    const newMember = {
      ...formData,
      id: Math.max(...members.map(m => m.id), 0) + 1
    }
    setMembers([...members, newMember])
    setCurrentPage(1)
    setModalType(null)
  }

  // Confirmar eliminación
  const handleConfirmDelete = () => {
    setMembers(members.filter(m => m.id !== selectedMember.id))
    setCurrentPage(1)
    setModalType(null)
    setSelectedMember(null)
  }

  // Manejar cambios en el formulario
  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  // Cerrar modal
  const closeModal = () => {
    setModalType(null)
    setSelectedMember(null)
  }

  // Cambiar página
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Título */}
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Trabajadores</h1>

      {/* Search y Botón Agregar */}
      <div className="mb-8 flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 transition"
          />
          <MagnifyingGlassIcon className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>
        <button
          onClick={handleAddMember}
          className="px-6 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition flex items-center gap-2"
        >
          <span>+</span> ADD MEMBER
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Member</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Function</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Employed</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMembers.length > 0 ? paginatedMembers.map((member) => (
              <tr key={member.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-600">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{member.function}</p>
                    <p className="text-sm text-gray-600">{member.organization}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    member.status === 'ONLINE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-200 text-gray-800'
                  }`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-900 font-medium">{member.employed}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(member)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition"
                      title="Editar"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(member)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No members found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="mt-6 flex justify-between items-center">
        <p className="text-gray-600 text-sm">Page {currentPage} of {totalPages}</p>
        <div className="flex gap-3">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="px-4 py-2 border-2 border-gray-900 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            PREVIOUS
          </button>
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border-2 border-gray-900 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            NEXT
          </button>
        </div>
      </div>

      {/* Modal Unificado Agregar/Editar */}
      {(modalType === 'add' || modalType === 'edit') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 flex justify-between items-center p-6 border-b border-gray-200 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                {modalType === 'add' ? 'Add New Member' : 'Edit Member'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 transition"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 transition"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Function</label>
                  <input
                    type="text"
                    name="function"
                    value={formData.function || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 transition"
                    placeholder="Job title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Organization</label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 transition"
                    placeholder="Department"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    name="status"
                    value={formData.status || 'ONLINE'}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 transition"
                  >
                    <option value="ONLINE">ONLINE</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Employed</label>
                  <input
                    type="text"
                    name="employed"
                    value={formData.employed || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 transition"
                    placeholder="DD/MM/YY"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 justify-end">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 border-2 border-gray-900 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={modalType === 'add' ? handleSaveAdd : handleSaveEdit}
                  className="px-6 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition"
                >
                  {modalType === 'add' ? 'Add Member' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {modalType === 'delete' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <TrashIcon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-center text-gray-900 mb-2">
                Delete Member
              </h3>
              <p className="text-center text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-semibold">{selectedMember?.name}</span>? This action cannot be undone.
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 border-2 border-gray-900 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TableUi
