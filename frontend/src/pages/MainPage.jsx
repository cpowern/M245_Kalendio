// import React, { useState } from 'react';
// import Calendar from 'react-calendar';
// import 'react-calendar/dist/Calendar.css'; // Standardstile für den Kalender
// import '../styles/MainPage.css'; // Eigene CSS-Stile

// const MainPage = () => {
//   const [date, setDate] = useState(new Date()); // Zustand für das ausgewählte Datum

//   return (
//     <div className="main-page">
//       {/* Top Bar */}
//       <div className="top-bar">
//         <h1 className="main-title">Kalendio</h1>
//         <div className="group-code">
//           <span>#05AB17</span>
//         </div>
//       </div>

//       {/* Hauptinhalt */}
//       <div className="main-content">
//         {/* Kalender */}
//         <div className="calendar-container">
//           <Calendar onChange={setDate} value={date} />
//           <p className="selected-date">Ausgewähltes Datum: {date.toLocaleDateString()}</p>
//         </div>

//         {/* Rechte Sidebar */}
//         <div className="side-panel">
//           <h2>Rangliste</h2>
//           <div className="podium">
//             <div className="second-place">
//               <p>2. Name</p>
//             </div>
//             <div className="first-place">
//               <p>1. Name</p>
//             </div>
//             <div className="third-place">
//               <p>3. Name</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MainPage;
