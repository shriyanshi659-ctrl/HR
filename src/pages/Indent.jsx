import React, { useEffect, useState } from 'react';
import { HistoryIcon, Plus, X } from 'lucide-react';
import useDataStore from '../store/dataStore';
import toast from 'react-hot-toast';

const Indent = () => {
  const { addIndent } = useDataStore();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    post: '',
    gender: '',
    prefer: '',
    numberOfPost: '',
    competitionDate: '',
    socialSite: '',
    indentNumber: '',
    timestamp: '',
  });
   const [indentData, setIndentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // const [lastIndentNumber, setLastIndentNumber] = useState(0);

// useEffect(() => {
//   const loadData = async () => {
//     const result = await fetchLastIndentNumber();
//     console.log('Fetch result:', result); // Debug
    
//     if (result.success) {
//       setLastIndentNumber(result.lastIndentNumber);
//       toast.success(`Last indent: ${result.fullLastIndent || result.lastIndentNumber}`);
//     } else {
//       toast.error(result.error);
//       // Fallback to starting from 1 if detection fails
//       setLastIndentNumber(1);
//     }
//   };
  
//   loadData();
// }, []);

  useEffect(() => {
    const loadData = async () => {
      setTableLoading(true);
      const result = await fetchIndentDataFromRow7();
      if (result.success) {
        console.log('Data from row 7:', result.data);
      } else {
        console.error('Error:', result.error);
      }
      setTableLoading(false);
    };
    loadData();
  }, []);

const generateIndentNumber = async () => {
  try {
    const result = await fetchLastIndentNumber();
    
    if (result.success) {
      const nextNumber = result.lastIndentNumber + 1;
      return `REC-${String(nextNumber).padStart(2, '0')}`;
    }
    // Fallback if fetch fails
    return 'REC-01';
  } catch (error) {
    console.error('Error generating indent number:', error);
    return 'REC-01';
  }
};

  const getCurrentTimestamp = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const fetchIndentDataFromRow7 = async () => {
  try {
    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbyBRPg5wM0ykxfwKX9j5XjZluuA1h8Sdz5VNqsNZrWyd69pklcH7TyZuF_HwNceHYs/exec?sheet=INDENT&action=fetch'
    );
    
    const result = await response.json();
    
    if (result.success && result.data && result.data.length >= 7) {
      // Get data starting from row 7 (array index 6) to end
      const dataFromRow7 = result.data.slice(6);
      
      // Find headers (assuming they're in row 6 - array index 5)
      const headers = result.data[5].map(h => h.trim());
      
      // Find column indices for important fields
      const timestampIndex = headers.indexOf('Timestamp');
      const indentNumberIndex = headers.indexOf('Indent Number');
      const postIndex = headers.indexOf('Post');
      const genderIndex = headers.indexOf('Gender');
       const preferIndex = headers.indexOf('Prefer');
         const noOFPostIndex = headers.indexOf('Number Of Posts');
         const completionDateIndex = headers.indexOf('Completion Date');
         const socialSiteIndex = headers.indexOf('Social Site');
      // Add other column indices as needed
      
      // Process the data
      const processedData = dataFromRow7.map(row => ({
        timestamp: row[timestampIndex],
        indentNumber: row[indentNumberIndex],
        post: row[postIndex],
        gender: row[genderIndex],
        prefer:row[preferIndex],
        noOfPost:row[noOFPostIndex],
        completionDate:row[completionDateIndex],
        socialSite:row[socialSiteIndex],
        // Add other fields as needed
      }));
      setIndentData(processedData)
      return {
        success: true,
        data: processedData,
        headers: headers
      };
    } else {
      return {
        success: false,
        error: 'Not enough rows in sheet data'
      };
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const fetchLastIndentNumber = async () => {
  try {
    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbyBRPg5wM0ykxfwKX9j5XjZluuA1h8Sdz5VNqsNZrWyd69pklcH7TyZuF_HwNceHYs/exec?sheet=INDENT&action=fetch'
    );
    
    const result = await response.json();
    console.log('Full sheet data:', result); // Debugging
    
    if (result.success && result.data && result.data.length > 1) {
      // Find the first row with actual headers (skip empty rows)
      let headerRowIndex = 0;
      while (headerRowIndex < result.data.length && 
             result.data[headerRowIndex].every(cell => !cell || cell.trim() === '')) {
        headerRowIndex++;
      }
      
      if (headerRowIndex >= result.data.length) {
        throw new Error('No header row found in sheet');
      }
      
      const headers = result.data[headerRowIndex].map(h => h ? h.trim().toLowerCase() : '');
      console.log('Headers found:', headers);
      
      // Try to find the indent number column by common names
      const possibleNames = ['indent number', 'indentnumber', 'indent_no', 'indentno', 'indent'];
      let indentNumberIndex = -1;
      
      for (const name of possibleNames) {
        indentNumberIndex = headers.indexOf(name);
        if (indentNumberIndex !== -1) break;
      }
      
      if (indentNumberIndex === -1) {
        // If still not found, try to find by position (from your screenshot it's column B/index 1)
        indentNumberIndex = 1;
        console.warn('Using fallback column index 1 for indent number');
      }
      
      // Find the last non-empty row with data
      let lastDataRowIndex = result.data.length - 1;
      while (lastDataRowIndex > headerRowIndex && 
             (!result.data[lastDataRowIndex][indentNumberIndex] || 
              result.data[lastDataRowIndex][indentNumberIndex].trim() === '')) {
        lastDataRowIndex--;
      }
      
      if (lastDataRowIndex <= headerRowIndex) {
        return {
          success: true,
          lastIndentNumber: 0,
          message: 'No data rows found'
        };
      }
      
      const lastIndentNumber = result.data[lastDataRowIndex][indentNumberIndex];
      console.log('Last indent number found:', lastIndentNumber);
      
      // Extract numeric part from "REC-01" format
      let numericValue = 0;
      if (typeof lastIndentNumber === 'string') {
        const match = lastIndentNumber.match(/\d+/);
        numericValue = match ? parseInt(match[0]) : 0;
      } else {
        numericValue = parseInt(lastIndentNumber) || 0;
      }
      
      return {
        success: true,
        lastIndentNumber: numericValue,
        fullLastIndent: lastIndentNumber
      };
    } else {
      return {
        success: true,
        lastIndentNumber: 0,
        message: 'Sheet is empty or has no data rows'
      };
    }
  } catch (error) {
    console.error('Error in fetchLastIndentNumber:', error);
    return {
      success: false,
      error: error.message,
      lastIndentNumber: 0
    };
  }
};





  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.post ||
      !formData.gender ||
      !formData.numberOfPost ||
      !formData.competitionDate ||
      !formData.socialSite
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      // Generate indent number and timestamp
      const indentNumber = await generateIndentNumber();
      const timestamp = getCurrentTimestamp();

      // Format the competition date to MM/DD/YYYY for Google Sheets
      const formattedDate = formatDateForSheet(formData.competitionDate);
      console.log(indentNumber);

      const rowData = [
        timestamp,
        indentNumber,
        formData.post,
        formData.gender,
        formData.prefer,
        formData.numberOfPost,
        formattedDate,
        formData.socialSite,
        "NeedMore"
      ];

      const response = await fetch('https://script.google.com/macros/s/AKfycbyBRPg5wM0ykxfwKX9j5XjZluuA1h8Sdz5VNqsNZrWyd69pklcH7TyZuF_HwNceHYs/exec', {
        method: 'POST',
        body: new URLSearchParams({
          sheetName: 'INDENT',
          action: 'insert',
          rowData: JSON.stringify(rowData),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Indent submitted successfully!');
        setFormData({
          post: '',
          gender: '',
          prefer: '',
          numberOfPost: '',
          competitionDate: '',
          socialSite: '',
          indentNumber: '',
          timestamp: '',
        });
        setShowModal(false);
        // Refresh the table data
        setTableLoading(true);
        await fetchIndentDataFromRow7();
        setTableLoading(false);
      } else {
        toast.error('Failed to insert: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Insert error:', error);
      toast.error('Something went wrong!');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to format date for Google Sheets
  const formatDateForSheet = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleCancel = () => {
    setFormData({
      post: '',
      gender: '',
      prefer: '',
      numberOfPost: '',
      competitionDate: '',
      socialSite: '',
      indentNumber: '',
      timestamp: '',
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-6 page-content p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Indent</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </>
          ) : (
            <>
              <Plus size={16} className="mr-2" />
              Create Indent
            </>
          )}
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">Create New Indent</h3>
              <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Post *</label>
                <input
                  type="text"
                  name="post"
                  value={formData.post}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter post title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Any">Any</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prefer</label>
                <input
                  type="text"
                  name="prefer"
                  value={formData.prefer}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter preferences"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number Of Post *</label>
                <input
                  type="number"
                  name="numberOfPost"
                  value={formData.numberOfPost}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter number of posts"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Competition Date *</label>
                <input
                  type="date"
                  name="competitionDate"
                  value={formData.competitionDate}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
 <div> 
  <label className="block text-sm font-medium text-gray-700 mb-1">Social Site *</label>
  <select 
    name="socialSite"
    value={formData.socialSite}
    onChange={handleInputChange}
    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    required
  >
    <option value="">Select</option>
    <option value="Yes">Yes</option>
    <option value="No">No</option>
  </select>
</div>


               <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-all duration-200"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-white rounded-xl shadow-lg border p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Indent Management</h2>
        <p className="text-gray-600">
          Create new indents for job positions. Once created, indents will be available in the Social Site section for further processing.
        </p>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
  <div className="overflow-x-auto">
    {/* Add max-height and overflow-y to the table container */}
    <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
      <table className="min-w-full divide-y divide-gray-200 shadow">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Indent Number</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prefer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. of Post</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Social Site</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {tableLoading ? (
            <tr>
              <td colSpan="7" className="px-6 py-12 text-center">
                <div className="flex justify-center flex-col items-center">
                  <div className="w-6 h-6 border-4 border-blue-500 border-dashed rounded-full animate-spin mb-2"></div>
                  <span className="text-gray-600 text-sm">Loading indent data...</span>
                </div>
              </td>
            </tr>
          ) : indentData.length === 0 ? (
            <tr>
              <td colSpan="7" className="px-6 py-12 text-center">
                <p className="text-gray-500">No indent data found.</p>
              </td>
            </tr>
          ) : (
            indentData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.indentNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.post}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.gender}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.prefer}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.noOfPost}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="text-sm text-gray-900 break-words">
                    {item.completionDate ? (() => {
                      const date = new Date(item.completionDate);
                      if (!date || isNaN(date.getTime())) return "Invalid date";
                      const day = date.getDate().toString().padStart(2, '0');
                      const month = (date.getMonth() + 1).toString().padStart(2, '0');
                      const year = date.getFullYear();
                      const hours = date.getHours().toString().padStart(2, '0');
                      const minutes = date.getMinutes().toString().padStart(2, '0');
                      const seconds = date.getSeconds().toString().padStart(2, '0');
                      return (
                        <div>
                          <div className="font-medium break-words">
                            {`${day}/${month}/${year}`}
                          </div>
                          <div className="text-xs text-gray-500 break-words">
                            {`${hours}:${minutes}:${seconds}`}
                          </div>
                        </div>
                      );
                    })() : "—"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.socialSite}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
</div>

    </div>
  );
};

export default Indent;







// import React, { useState, useEffect } from 'react';
// import { Filter, Search, Clock, CheckCircle, X, Upload } from 'lucide-react';
// import useDataStore from '../store/dataStore';
// import toast from 'react-hot-toast';

// const FindEnquiry = () => {
//   const { socialSiteData, findEnquiryData, addEnquiry } = useDataStore();
//   const [activeTab, setActiveTab] = useState('pending');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [showModal, setShowModal] = useState(false);
//   const [selectedItem, setSelectedItem] = useState(null);
//   const [indentData, setIndentData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [tableLoading, setTableLoading] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState(null);
  
//   const [formData, setFormData] = useState({
//     candidateName: '',
//     candidateDOB: '',
//     candidatePhone: '',
//     candidateEmail: '',
//     previousCompany: '',
//     jobExperience: '',
//     lastSalary: '',
//     previousPosition: '',
//     reasonForLeaving: '',
//     maritalStatus: '',
//     lastEmployerMobile: '',
//     candidatePhoto: null,
//     candidateResume: null,
//     referenceBy: '',
//     presentAddress: '',
//     aadharNo: ''
//   });

//   const fetchIndentDataFromRow7 = async () => {
//     setLoading(true);
//     setTableLoading(true);
//     setError(null);
//     try {
//       const response = await fetch(
//         'https://script.google.com/macros/s/AKfycbyBRPg5wM0ykxfwKX9j5XjZluuA1h8Sdz5VNqsNZrWyd69pklcH7TyZuF_HwNceHYs/exec?sheet=INDENT&action=fetch'
//       );
      
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
      
//       const result = await response.json();
      
//       if (result.success && result.data && result.data.length >= 7) {
//         const headers = result.data[5].map(h => h.trim());
//         const dataFromRow7 = result.data.slice(6);
        
//         // Find column indices
//         const getIndex = (headerName) => headers.findIndex(h => h === headerName);
        
//         const processedData = dataFromRow7
//           .filter(row => {
//             const status = row[getIndex('Status')];
//             const planned2 = row[getIndex('Planned 2')];
//             const actual2 = row[getIndex('Actual 2')];
            
//             return status === 'open' && 
//                    planned2 && 
//                    (!actual2 || actual2 === '');
//           })
//           .map(row => ({
//             id: row[getIndex('Timestamp')], // Using timestamp as ID
//             indentNo: row[getIndex('Indent Number')],
//             post: row[getIndex('Post')],
//             gender: row[getIndex('Gender')],
//             prefer: row[getIndex('Prefer')],
//             numberOfPost: row[getIndex('Number Of Posts')],
//             competitionDate: row[getIndex('Completion Date')],
//             socialSite: row[getIndex('Social Site')],
//             status: row[getIndex('Status')]
//           }));
        
//         setIndentData(processedData);
//       } else {
//         throw new Error(result.error || 'Not enough rows in sheet data');
//       }
//     } catch (error) {
//       console.error('Error fetching data:', error);
//       setError(error.message);
//       toast.error('Failed to fetch indent data');
//     } finally {
//       setLoading(false);
//       setTableLoading(false);
//     }
//   };



//   useEffect(() => {
//     fetchIndentDataFromRow7();
//   }, []);

//   const pendingData = indentData.filter(item => 
//     !findEnquiryData.some(enquiry => enquiry.indentId === item.id)
//   );

//   const historyData = findEnquiryData;

//   const handleEnquiryClick = (item) => {
//     setSelectedItem(item);
//     setFormData({
//       candidateName: '',
//       candidateDOB: '',
//       candidatePhone: '',
//       candidateEmail: '',
//       previousCompany: '',
//       jobExperience: '',
//       lastSalary: '',
//       previousPosition: '',
//       reasonForLeaving: '',
//       maritalStatus: '',
//       lastEmployerMobile: '',
//       candidatePhoto: null,
//       candidateResume: null,
//       referenceBy: '',
//       presentAddress: '',
//       aadharNo: ''
//     });
//     setShowModal(true);
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleFileChange = (e, fieldName) => {
//     const file = e.target.files[0];
//     if (file) {
//       setFormData(prev => ({
//         ...prev,
//         [fieldName]: file
//       }));
//     }
//   };




// const handleSubmit = async (e) => {
//   e.preventDefault();

//   // Validate required fields
//   if (!formData.candidateName || !formData.candidatePhone || !formData.candidateEmail) {
//     toast.error('Please fill all required fields');
//     return;
//   }

//   try {
//     setSubmitting(true);
//      const now = new Date();
//     const formattedTimestamp = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

//     // Prepare the submission data as an array (to match sheet columns)
//     const rowData = [
//      formattedTimestamp, // Timestamp
//       selectedItem.indentNo, // Indent Number
//       `ENQ-${String(findEnquiryData.length + 1).padStart(2, '0')}`, // Candidate Enquiry Number
//       selectedItem?.post || '', // Applying For the Post
//       formData.candidateName, // Candidate Name
//       formData.candidateDOB, // DOB
//       formData.candidatePhone, // Candidate Phone Number
//       formData.candidateEmail, // Candidate Email
//       formData.previousCompany, // Previous Company Name
//       formData.jobExperience, // Job Experience
//       formData.lastSalary, // Last Salary
//       formData.previousPosition, // Previous Position
//       formData.reasonForLeaving, // Reason For Leaving
//       formData.maritalStatus, // Marital Status
//       formData.lastEmployerMobile, // Last Employer Mobile
//       '', // Photo URL (will be empty initially)
//       '', // Resume URL (will be empty initially)
//       formData.referenceBy, // Reference By
//       formData.presentAddress, // Present Address
//       formData.aadharNo // Aadhar No
//     ];

//     // Create form payload - NOTE THE PARAMETER NAMES MUST MATCH APPS SCRIPT
//     const formPayload = new URLSearchParams();
//     formPayload.append('sheetName', 'ENQUIRY'); // Must be 'sheetName' not 'sheet'
//     formPayload.append('action', 'insert');
//     formPayload.append('rowData', JSON.stringify(rowData));

//     const scriptUrl = 'https://script.google.com/macros/s/AKfycbyBRPg5wM0ykxfwKX9j5XjZluuA1h8Sdz5VNqsNZrWyd69pklcH7TyZuF_HwNceHYs/exec';
    
//     // Using POST with form data
//     const response = await fetch(scriptUrl, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//       },
//       body: formPayload
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const result = await response.json();

//     if (result && result.success) {
//       toast.success('Enquiry submitted successfully!');
//       setShowModal(false);
//     //  Add to local state
//       addEnquiry({
//         ...formData,
//         id: Date.now().toString(),
//         indentId: selectedItem.id,
//         indentNo: selectedItem.indentNo,
//         candidateEnquiryNo: `ENQ-${String(findEnquiryData.length + 1).padStart(2, '0')}`,
//         applyingForPost: selectedItem.post,
//         status: 'submitted'
//       });
//     //  Refresh data
//       await fetchIndentDataFromRow7();
//     } else {
//       throw new Error(result?.error || 'Submission failed without error message');
//     }

//   } catch (error) {
//     console.error('Error submitting enquiry:', error);
//     toast.error(`Failed to submit: ${error.message}`);
//   } finally {
//     setSubmitting(false);
//   }
// };
//   const filteredPendingData = pendingData.filter(item => {
//     const matchesSearch = item.post?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          item.indentNo?.toLowerCase().includes(searchTerm.toLowerCase());
//     return matchesSearch;
//   });

//   const filteredHistoryData = historyData.filter(item => {
//     const matchesSearch = item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          item.candidateEnquiryNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          item.indentNo?.toLowerCase().includes(searchTerm.toLowerCase());
//     return matchesSearch;
//   });

//   // if (loading) {
//   //   return (
//   //     <div className="flex justify-center items-center h-64">
//   //       <div className="flex flex-col items-center">
//   //         <div className="w-12 h-12 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-4"></div>
//   //         <span className="text-gray-600">Loading enquiry data...</span>
//   //       </div>
//   //     </div>
//   //   );
//   // }

//   // if (error) {
//   //   return (
//   //     <div className="flex justify-center items-center h-64">
//   //       <div className="text-red-500 text-center">
//   //         <p>Error loading data:</p>
//   //         <p className="font-medium">{error}</p>
//   //         <button 
//   //           onClick={fetchIndentDataFromRow7}
//   //           className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all duration-200"
//   //         >
//   //           Retry
//   //         </button>
//   //       </div>
//   //     </div>
//   //   );
//   // }

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-bold text-gray-800">Find Enquiry</h1>
//       </div>

//       {/* Filter and Search */}
//       <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
//         <div className="flex flex-1 max-w-md">
//           <div className="relative w-full">
//             <input
//               type="text"
//               placeholder="Search..."
//               className="w-full pl-10 pr-4 py-2 border border-gray-400 border-opacity-30 rounded-lg focus:outline-none focus:ring-2  bg-white bg-opacity-10 focus:ring-indigo-500 text-gray-600  "
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//             <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 opacity-60" />
//           </div>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="bg-white rounded-lg shadow overflow-hidden">
//         <div className="border-b border-gray-300 border-opacity-20">
//           <nav className="flex -mb-px">
//             <button
//               className={`py-4 px-6 font-medium text-sm border-b-2 ${
//                 activeTab === 'pending'
//                   ?'border-indigo-500 text-indigo-600'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//               onClick={() => setActiveTab('pending')}
//             >
//               <Clock size={16} className="inline mr-2" />
//               Pending ({filteredPendingData.length})
//             </button>
//             <button
//               className={`py-4 px-6 font-medium text-sm border-b-2 ${
//                 activeTab === 'history'
//                   ? 'border-indigo-500 text-indigo-600'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//               onClick={() => setActiveTab('history')}
//             >
//               <CheckCircle size={16} className="inline mr-2" />
//               History ({filteredHistoryData.length})
//             </button>
//           </nav>
//         </div>

//         {/* Tab Content */}
//         <div className="p-6">
//           {activeTab === 'pending' && (
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200 ">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 uppercase tracking-wider">Action</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 uppercase tracking-wider">Indent No.</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 uppercase tracking-wider">Post</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 uppercase tracking-wider">Gender</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 uppercase tracking-wider">Prefer</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 uppercase tracking-wider">Number Of Post</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 uppercase tracking-wider">Competition Date</th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {tableLoading ? (
//                     <tr>
//                       <td colSpan="7" className="px-6 py-12 text-center">
//                         <div className="flex justify-center flex-col items-center">
//                           <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
//                           <span className="text-gray-600 text-sm">Loading pending enquiries...</span>
//                         </div>
//                       </td>
//                     </tr>
//                   ) : filteredPendingData.length === 0 ? (
//                     <tr>
//                       <td colSpan="7" className="px-6 py-12 text-center">
//                         <p className="text-gray-500">No pending enquiries found.</p>
//                       </td>
//                     </tr>
//                   ) : (
//                     filteredPendingData.map((item) => (
//                       <tr key={item.id} className="hover:bg-gray-50">
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <button
//                             onClick={() => handleEnquiryClick(item)}
//                             className="px-3 py-1 text-white bg-indigo-700 rounded-md hover:bg-opacity-90 text-sm"
//                           >
//                             Enquiry
//                           </button>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.indentNo}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.post}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.gender}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.prefer || '-'}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.numberOfPost}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                           {item.competitionDate ? new Date(item.competitionDate).toLocaleDateString() : '-'}
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           )}

//           {activeTab === 'history' && (
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y  divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Indent No.</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate Enquiry No.</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applying For Post</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate Name</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resume</th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {tableLoading ? (
//                     <tr>
//                       <td colSpan="9" className="px-6 py-12 text-center">
//                         <div className="flex justify-center flex-col items-center">
//                           <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
//                           <span className="text-gray-600 text-sm">Loading enquiry history...</span>
//                         </div>
//                       </td>
//                     </tr>
//                   ) : filteredHistoryData.length === 0 ? (
//                     <tr>
//                       <td colSpan="9" className="px-6 py-12 text-center">
//                         <p className="text-gray-500 ">No enquiry history found.</p>
//                       </td>
//                     </tr>
//                   ) : (
//                     filteredHistoryData.map((item) => (
//                       <tr key={item.id} className="hover:bg-gray-50">
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.indentNo}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.candidateEnquiryNo}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.applyingForPost}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.candidateName}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.candidatePhone}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.candidateEmail}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.jobExperience}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                           {item.candidatePhoto && (
//                             <button
//                               onClick={() => window.open(item.candidatePhoto, '_blank')}
//                               className="text-gray-500 hover:text-opacity-80 text-sm underline"
//                             >
//                               View
//                             </button>
//                           )}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                           {item.candidateResume && (
//                             <button
//                               onClick={() => window.open(item.candidateResume, '_blank')}
//                               className="text-gray-500 hover:text-opacity-80 text-sm underline"
//                             >
//                               View
//                             </button>
//                           )}
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Modal */}
//       {showModal && selectedItem && (
//         <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
//             <div className="flex justify-between items-center p-6 border-b border-gray-300 border-opacity-20">
//               <h3 className="text-lg font-medium text-gray-500">Candidate Enquiry Form</h3>
//               <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-opacity-80">
//                 <X size={20} />
//               </button>
//             </div>
//             <form onSubmit={handleSubmit} className="p-6 space-y-4">
//                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Indent No.</label>
//                   <input
//                     type="text"
//                     value={selectedItem.indentNo}
//                     disabled
//                     className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 bg-white bg-opacity-5 text-gray-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Candidate Enquiry No.</label>
//                   <input
//                     type="text"
//                     value={`EN-${String(findEnquiryData.length + 1).padStart(3, '0')}`}
//                     disabled
//                     className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 bg-white bg-opacity-5 text-gray-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Applying For Post</label>
//                   <input
//                     type="text"
//                     value={selectedItem.post}
//                     disabled
//                     className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 bg-white bg-opacity-5 text-gray-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Candidate Name *</label>
//                   <input
//                     type="text"
//                     name="candidateName"
//                     value={formData.candidateName}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500 placeholder-white placeholder-opacity-60"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Candidate DOB</label>
//                   <input
//                     type="date"
//                     name="candidateDOB"
//                     value={formData.candidateDOB}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Candidate Phone *</label>
//                   <input
//                     type="tel"
//                     name="candidatePhone"
//                     value={formData.candidatePhone}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500 placeholder-white placeholder-opacity-60"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Candidate Email *</label>
//                   <input
//                     type="email"
//                     name="candidateEmail"
//                     value={formData.candidateEmail}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500 placeholder-white placeholder-opacity-60"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Previous Company</label>
//                   <input
//                     type="text"
//                     name="previousCompany"
//                     value={formData.previousCompany}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500 placeholder-white placeholder-opacity-60"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Job Experience</label>
//                   <input
//                     type="text"
//                     name="jobExperience"
//                     value={formData.jobExperience}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500 placeholder-white placeholder-opacity-60"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Last Salary Drawn</label>
//                   <input
//                     type="number"
//                     name="lastSalary"
//                     value={formData.lastSalary}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500 placeholder-white placeholder-opacity-60"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Previous Position</label>
//                   <input
//                     type="text"
//                     name="previousPosition"
//                     value={formData.previousPosition}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500 placeholder-white placeholder-opacity-60"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Reason for Leaving</label>
//                   <input
//                     type="text"
//                     name="reasonForLeaving"
//                     value={formData.reasonForLeaving}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500 placeholder-white placeholder-opacity-60"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Marital Status</label>
//                   <select
//                     name="maritalStatus"
//                     value={formData.maritalStatus}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500"
//                   >
//                     <option value="">Select Status</option>
//                     <option value="Single">Single</option>
//                     <option value="Married">Married</option>
//                     <option value="Divorced">Divorced</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Last Employer Mobile</label>
//                   <input
//                     type="tel"
//                     name="lastEmployerMobile"
//                     value={formData.lastEmployerMobile}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500 placeholder-white placeholder-opacity-60"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Reference By</label>
//                   <input
//                     type="text"
//                     name="referenceBy"
//                     value={formData.referenceBy}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500 placeholder-white placeholder-opacity-60"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Aadhar No.</label>
//                   <input
//                     type="text"
//                     name="aadharNo"
//                     value={formData.aadharNo}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500 placeholder-white placeholder-opacity-60"
//                   />
//                 </div>
//               </div>
              
//               <div>
//                 <label className="block text-sm font-medium text-gray-500 mb-1">Present Address</label>
//                 <textarea
//                   name="presentAddress"
//                   value={formData.presentAddress}
//                   onChange={handleInputChange}
//                   rows={3}
//                   className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500 placeholder-white placeholder-opacity-60"
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Candidate Photo</label>
//                   <div className="flex items-center space-x-2">
//                     <input
//                       type="file"
//                       accept="image/*"
//                       onChange={(e) => handleFileChange(e, 'candidatePhoto')}
//                       className="hidden"
//                       id="photo-upload"
//                     />
//                     <label
//                       htmlFor="photo-upload"
//                       className="flex items-center px-4 py-2 border border-gray-300 border-opacity-30 rounded-md cursor-pointer hover:bg-white hover:bg-opacity-10 text-gray-500"
//                     >
//                       <Upload size={16} className="mr-2" />
//                       Upload Photo
//                     </label>
//                     {formData.candidatePhoto && (
//                       <span className="text-sm text-gray-500 opacity-80">{formData.candidatePhoto.name}</span>
//                     )}
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-500 mb-1">Candidate Resume</label>
//                   <div className="flex items-center space-x-2">
//                     <input
//                       type="file"
//                       accept=".pdf,.doc,.docx"
//                       onChange={(e) => handleFileChange(e, 'candidateResume')}
//                       className="hidden"
//                       id="resume-upload"
//                     />
//                     <label
//                       htmlFor="resume-upload"
//                       className="flex items-center px-4 py-2 border border-gray-300 border-opacity-30 rounded-md cursor-pointer hover:bg-white hover:bg-opacity-10 text-gray-500"
//                     >
//                       <Upload size={16} className="mr-2" />
//                       Upload Resume
//                     </label>
//                     {formData.candidateResume && (
//                       <span className="text-sm text-gray-500 opacity-80">{formData.candidateResume.name}</span>
//                     )}
//                   </div>
//                 </div>
//               </div>
              
//               <div className="flex justify-end space-x-2 pt-4">
//                 <button
//                   type="button"
//                   onClick={() => setShowModal(false)}
//                   className="px-4 py-2 border border-gray-300 border-opacity-30 rounded-md text-gray-500 hover:bg-white hover:bg-opacity-10"
//                   disabled={submitting}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-opacity-90 flex items-center justify-center"
//                   disabled={submitting}
//                 >
//                   {submitting ? (
//                     <>
//                       <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                       </svg>
//                       Submitting...
//                     </>
//                   ) : 'Submit'}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default FindEnquiry;


// useEffect(() => {
//   // Clear existing enquiry data when component mounts
//   useDataStore.setState({ findEnquiryData: [] });
  
//   // Fetch indent data
//   fetchIndentDataFromRow7();
// }, []);