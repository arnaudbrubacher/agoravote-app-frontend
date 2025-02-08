export const groups = [
  {
    id: 1,
    name: 'Marketing Strategy Team',
    description: 'Coordinate marketing campaigns and brand strategy',
    isPrivate: false,
    requiresPassword: false,
    password: '',
    documents: [],
    picture: '#FF5733', // Color tag
    members: [1, 2],
    lastActive: '2023-10-01T12:00:00Z'
  },
  {
    id: 2,
    name: 'Product Development',
    description: 'Design and implementation of new features',
    isPrivate: false,
    requiresPassword: false,
    password: '',
    documents: [],
    picture: '#33FF57', // Color tag
    members: [3],
    lastActive: '2023-10-02T12:00:00Z'
  },
  {
    id: 3,
    name: 'Office Management',
    description: 'Workplace organization and logistics',
    isPrivate: true,
    requiresPassword: true,
    password: 'office123',
    documents: [{ name: 'ID Proof' }, { name: 'Address Proof' }],
    picture: '#3357FF', // Color tag
    members: [1],
    lastActive: '2023-10-03T12:00:00Z'
  },
  {
    id: 4,
    name: 'Sales Team',
    description: 'Sales strategies and discussions',
    isPrivate: false,
    requiresPassword: false,
    password: '',
    documents: [],
    picture: '#FF33A1', // Color tag
    members: [4, 5],
    lastActive: '2023-10-04T12:00:00Z'
  },
  {
    id: 5,
    name: 'HR Team',
    description: 'Human resources and employee relations',
    isPrivate: true,
    requiresPassword: true,
    password: 'hrteam123',
    documents: [{ name: 'Resume' }, { name: 'Cover Letter' }],
    picture: '#A133FF', // Color tag
    members: [6, 7],
    lastActive: '2023-10-05T12:00:00Z'
  }
];