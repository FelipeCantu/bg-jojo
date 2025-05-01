// // Create a new SuccessPage.js component
// import { useEffect } from 'react';
// import { useLocation } from 'react-router-dom';
// import { getFirestore, doc, updateDoc } from 'firebase/firestore';

// export default function SuccessPage() {
//   const location = useLocation();
//   const searchParams = new URLSearchParams(location.search);
//   const sessionId = searchParams.get('session_id');
//   const orderId = searchParams.get('order_id');

//   useEffect(() => {
//     if (sessionId && orderId) {
//       const updateOrderStatus = async () => {
//         const db = getFirestore();
//         await updateDoc(doc(db, 'orders', orderId), {
//           status: 'paid',
//           paymentId: sessionId,
//           paidAt: serverTimestamp()
//         });
//       };
//       updateOrderStatus();
//     }
//   }, [sessionId, orderId]);

//   return (
//     <div>
//       <h2>Payment Successful!</h2>
//       <p>Order ID: {orderId}</p>
//     </div>
//   );
// }