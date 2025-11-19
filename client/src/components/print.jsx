import React from 'react'

function printComp() {

{printPreview.open && (
  <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50 p-4">
    <div className="relative w-full max-w-5xl bg-white rounded-lg overflow-hidden shadow-2xl">
      <div className="flex justify-between items-center bg-gray-800 text-white p-3">
        <h3 className="text-lg font-semibold">Print Preview</h3>
        <button
          onClick={() => setPrintPreview({ open: false, fileUrl: "" })}
          className="text-white hover:text-red-400"
        >
          ✕
        </button>
      </div>

      <div className="flex justify-center items-center bg-gray-100 p-4 h-[80vh] overflow-auto">
        {/\.(jpg|jpeg|png|gif|webp)$/i.test(printPreview.fileUrl) ? (
          <img
            src={printPreview.fileUrl}
            alt="Preview"
            className="object-contain max-h-full max-w-full"
          />
        ) : /\.pdf$/i.test(printPreview.fileUrl) ? (
          <iframe
            src={printPreview.fileUrl}
            title="PDF Preview"
            className="w-full h-full rounded-md"
          />
        ) : (
          <p className="text-gray-600 text-center">No preview available</p>
        )}
      </div>

      <div className="flex justify-center gap-3 bg-gray-100 p-3">
        <button
          onClick={confirmPrint}
          className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Print
        </button>
        <button
          onClick={() => setPrintPreview({ open: false, fileUrl: "" })}
          className="px-5 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

  
}

export default printComp