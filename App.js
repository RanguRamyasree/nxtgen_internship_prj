// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import io from 'socket.io-client';
import DocumentList from './components/DocumentList';
import DocumentEditor from './components/DocumentEditor';

const App = () => {
  return (
    <Router>
      <div className="container mx-auto p-4">
        <nav className="mb-4">
          <Link to="/" className="text-blue-500 hover:text-blue-700">Home</Link>
        </nav>
        <Routes>
          <Route path="/" element={<DocumentList />} />
          <Route path="/document/:id" element={<DocumentEditor />} />
        </Routes>
      </div>
    </Router>
  );
};

// src/components/DocumentList.js
const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [newDocTitle, setNewDocTitle] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/documents');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const createDocument = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newDocTitle,
          content: '',
        }),
      });
      const newDoc = await response.json();
      setDocuments([newDoc, ...documents]);
      setNewDocTitle('');
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  return (
    <div>
      <h1 className="text-2xl mb-4">Documents</h1>
      <form onSubmit={createDocument} className="mb-4">
        <input
          type="text"
          value={newDocTitle}
          onChange={(e) => setNewDocTitle(e.target.value)}
          placeholder="New document title"
          className="border p-2 mr-2"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Create Document
        </button>
      </form>
      <div className="grid gap-4">
        {documents.map((doc) => (
          <div
            key={doc._id}
            className="border p-4 rounded"
          >
            <Link
              to={`/document/${doc._id}`}
              className="text-blue-500 hover:text-blue-700"
            >
              {doc.title}
            </Link>
            <p className="text-sm text-gray-500">
              Last modified: {new Date(doc.lastModified).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// src/components/DocumentEditor.js
import { useParams } from 'react-router-dom';
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';

const DocumentEditor = () => {
  const { id } = useParams();
  const { quill, quillRef } = useQuill({
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['clean']
      ]
    },
    theme: 'snow'
  });
  const [socket, setSocket] = useState(null);
  const [document, setDocument] = useState(null);

  useEffect(() => {
    const s = io('http://localhost:5000');
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.emit('join-document', id);

    socket.on('receive-changes', (delta) => {
      quill.updateContents(delta);
    });

    return () => {
      socket.off('receive-changes');
    };
  }, [socket, quill, id]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== 'user') return;
      socket.emit('send-changes', delta, id);
      
      // Save to database every few seconds
      const saveToServer = debounce(() => {
        socket.emit('save-document', {
          documentId: id,
          content: quill.root.innerHTML
        });
      }, 2000);
      
      saveToServer();
    };

    quill.on('text-change', handler);

    return () => {
      quill.off('text-change', handler);
    };
  }, [socket, quill, id]);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/documents/${id}`);
        const doc = await response.json();
        setDocument(doc);
        if (quill) {
          quill.setContents([{ insert: doc.content || '' }]);
        }
      } catch (error) {
        console.error('Error fetching document:', error);
      }
    };

    if (id) fetchDocument();
  }, [id, quill]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl mb-4">{document?.title}</h1>
      <div className="bg-white">
        <div ref={quillRef} style={{ height: '400px' }} />
      </div>
    </div>
  );
};

export default App;
