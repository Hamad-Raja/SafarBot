const routes = [
  // ========= ISLAMABAD ROUTES =========
  {
    id: 'FM-ISB-LHR-01',
    operator: 'Faisal Movers',
    from: 'Islamabad',
    to: 'Lahore',
    date: '2025-12-01',
    departureTime: '08:00 AM',
    arrivalTime: '01:30 PM',
    duration: '5h 30m',
    busType: 'Business Class',
    price: 2500,
    rating: 4.7
  },
  {
    id: 'DW-ISB-RWP-03',
    operator: 'Daewoo Express',
    from: 'Islamabad',
    to: 'Rawalpindi',
    date: '2025-12-03',
    departureTime: '09:00 AM',
    arrivalTime: '10:00 AM',
    duration: '1h',
    busType: 'Luxury',
    price: 900,
    rating: 4.6
  },
  {
    id: 'FM-ISB-FSD-05',
    operator: 'Faisal Movers',
    from: 'Islamabad',
    to: 'Faisalabad',
    date: '2025-12-05',
    departureTime: '10:00 AM',
    arrivalTime: '03:00 PM',
    duration: '5h',
    busType: 'Executive',
    price: 2800,
    rating: 4.5
  },

  // ========= LAHORE ROUTES =========
  {
    id: 'DW-LHR-KHI-07',
    operator: 'Daewoo Express',
    from: 'Lahore',
    to: 'Karachi',
    date: '2025-12-07',
    departureTime: '06:00 PM',
    arrivalTime: '12:00 PM',
    duration: '18h',
    busType: 'Sleeper',
    price: 6500,
    rating: 4.8
  },
  {
    id: 'FM-LHR-GJW-09',
    operator: 'Faisal Movers',
    from: 'Lahore',
    to: 'Gujranwala',
    date: '2025-12-09',
    departureTime: '07:30 AM',
    arrivalTime: '09:30 AM',
    duration: '2h',
    busType: 'Executive',
    price: 1500,
    rating: 4.4
  },

  // ========= KARACHI ROUTES =========
  {
    id: 'DW-KHI-HYD-11',
    operator: 'Daewoo Express',
    from: 'Karachi',
    to: 'Hyderabad',
    date: '2025-12-11',
    departureTime: '08:00 AM',
    arrivalTime: '10:30 AM',
    duration: '2h 30m',
    busType: 'Luxury',
    price: 1700,
    rating: 4.5
  },
  {
    id: 'FM-KHI-SUK-13',
    operator: 'Faisal Movers',
    from: 'Karachi',
    to: 'Sukkur',
    date: '2025-12-13',
    departureTime: '09:00 PM',
    arrivalTime: '06:00 AM',
    duration: '9h',
    busType: 'Sleeper',
    price: 4200,
    rating: 4.6
  },

  // ========= KP ROUTES =========
  {
    id: 'SK-PSH-ISB-15',
    operator: 'Skyways',
    from: 'Peshawar',
    to: 'Islamabad',
    date: '2025-12-15',
    departureTime: '06:00 AM',
    arrivalTime: '09:00 AM',
    duration: '3h',
    busType: 'Luxury',
    price: 2200,
    rating: 4.4
  },
  {
    id: 'FM-MRD-ISB-17',
    operator: 'Faisal Movers',
    from: 'Mardan',
    to: 'Islamabad',
    date: '2025-12-17',
    departureTime: '07:00 AM',
    arrivalTime: '11:00 AM',
    duration: '4h',
    busType: 'Executive',
    price: 2300,
    rating: 4.3
  },

  // ========= SOUTH PUNJAB =========
  {
    id: 'DW-MTN-LHR-19',
    operator: 'Daewoo Express',
    from: 'Multan',
    to: 'Lahore',
    date: '2025-12-19',
    departureTime: '05:00 PM',
    arrivalTime: '11:00 PM',
    duration: '6h',
    busType: 'Business',
    price: 3200,
    rating: 4.6
  },
  {
    id: 'FM-BWP-MTN-21',
    operator: 'Faisal Movers',
    from: 'Bahawalpur',
    to: 'Multan',
    date: '2025-12-21',
    departureTime: '09:00 AM',
    arrivalTime: '12:00 PM',
    duration: '3h',
    busType: 'Executive',
    price: 1800,
    rating: 4.4
  },

  // ========= END OF MONTH =========
  {
    id: 'FM-ISB-LHR-29',
    operator: 'Faisal Movers',
    from: 'Islamabad',
    to: 'Lahore',
    date: '2025-12-29',
    departureTime: '11:00 PM',
    arrivalTime: '04:30 AM',
    duration: '5h 30m',
    busType: 'Sleeper',
    price: 3000,
    rating: 4.8
  },
  {
    id: 'DW-LHR-ISB-31',
    operator: 'Daewoo Express',
    from: 'Lahore',
    to: 'Islamabad',
    date: '2025-12-31',
    departureTime: '07:00 PM',
    arrivalTime: '12:30 AM',
    duration: '5h 30m',
    busType: 'Luxury',
    price: 2900,
    rating: 4.7
  }
];

module.exports = routes;