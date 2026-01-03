import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState("login");
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [showAddAnimation, setShowAddAnimation] = useState(false);
  const [highlightMyNotes, setHighlightMyNotes] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const storedAccess = localStorage.getItem("accessToken");
    const storedRefresh = localStorage.getItem("refreshToken");
    const storedEmail = localStorage.getItem("userEmail");

    if (storedAccess && storedRefresh && storedEmail) {
      setAccessToken(storedAccess);
      setRefreshToken(storedRefresh);
      setUserEmail(storedEmail);
      setCurrentPage("add");
      fetchNotes(storedAccess);
    }
  }, []);

  const fetchNotes = (tokenParam) => {
    const tokenToUse = tokenParam || accessToken;
    if (!tokenToUse) return;

    fetch("http://127.0.0.1:8000/api/notes/", {
      headers: {
        Authorization: `Bearer ${tokenToUse}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          handleLogout();
          return [];
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setNotes(data);
        }
      })
      .catch(() => {});
  };

  const handleRegister = () => {
    setAuthError("");
    if (!registerEmail || !registerPassword) return;

    const email = registerEmail;
    const password = registerPassword;

    fetch("http://127.0.0.1:8000/api/auth/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          setAuthError("Sign up failed. Try another email or password.");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;

        fetch("http://127.0.0.1:8000/api/auth/login/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: email,
            password: password,
          }),
        })
          .then((res) => {
            if (!res.ok) {
              setAuthError("Account created, please login.");
              setCurrentPage("login");
              return null;
            }
            return res.json();
          })
          .then((loginData) => {
            if (!loginData) return;
            setAccessToken(loginData.access);
            setRefreshToken(loginData.refresh);
            setUserEmail(email);
            localStorage.setItem("accessToken", loginData.access);
            localStorage.setItem("refreshToken", loginData.refresh);
            localStorage.setItem("userEmail", email);
            setRegisterEmail("");
            setRegisterPassword("");
            setCurrentPage("add");
            fetchNotes(loginData.access);
          })
          .catch(() => {
            setAuthError("Account created, but login failed. Please login.");
            setCurrentPage("login");
          });
      })
      .catch(() => {
        setAuthError("Something went wrong. Please try again.");
      });
  };

  const handleLogin = () => {
    setAuthError("");
    if (!loginEmail || !loginPassword) return;

    fetch("http://127.0.0.1:8000/api/auth/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: loginEmail,
        password: loginPassword,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          setAuthError("Invalid email or password.");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setAccessToken(data.access);
        setRefreshToken(data.refresh);
        setUserEmail(loginEmail);
        localStorage.setItem("accessToken", data.access);
        localStorage.setItem("refreshToken", data.refresh);
        localStorage.setItem("userEmail", loginEmail);
        setCurrentPage("add");
        fetchNotes(data.access);
      })
      .catch(() => {
        setAuthError("Something went wrong. Please try again.");
      });
  };

  const handleLogout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUserEmail("");
    setNotes([]);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userEmail");
    setCurrentPage("login");
    setTitle("");
    setContent("");
    setEditingId(null);
  };

  const addNote = () => {
    if (!title && !content) return;
    if (!accessToken) return;

    if (editingId === null) {
      fetch("http://127.0.0.1:8000/api/notes/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ title, content }),
      })
        .then((res) => res.json())
        .then((newNote) => {
          setNotes([newNote, ...notes]);
          setTitle("");
          setContent("");
          setEditingId(null);
          setShowAddAnimation(true);
          setHighlightMyNotes(true);
          setTimeout(() => {
            setShowAddAnimation(false);
            setHighlightMyNotes(false);
          }, 900);
        })
        .catch(() => {});
    } else {
      fetch(`http://127.0.0.1:8000/api/notes/${editingId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ title, content }),
      })
        .then((res) => res.json())
        .then((updatedNote) => {
          setNotes(
            notes.map((note) => (note.id === editingId ? updatedNote : note))
          );
          setTitle("");
          setContent("");
          setEditingId(null);
          setCurrentPage("notes");
        })
        .catch(() => {});
    }
  };

  const deleteNote = (id) => {
    if (!accessToken) return;

    fetch(`http://127.0.0.1:8000/api/notes/${id}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then(() => {
        setNotes(notes.filter((note) => note.id !== id));
      })
      .catch(() => {});
  };

  const startEdit = (note) => {
    setTitle(note.title);
    setContent(note.content);
    setEditingId(note.id);
    setCurrentPage("add");
  };

  const goToAddPage = () => {
    if (!accessToken) {
      setCurrentPage("login");
      return;
    }
    setCurrentPage("add");
    setEditingId(null);
    setTitle("");
    setContent("");
    setShowAddAnimation(false);
    setHighlightMyNotes(false);
  };

  const goToNotesPage = () => {
    if (!accessToken) {
      setCurrentPage("login");
      return;
    }
    setCurrentPage("notes");
    setEditingId(null);
    setShowAddAnimation(false);
    setHighlightMyNotes(false);
    fetchNotes();
  };

  const goToAboutPage = () => {
    if (!accessToken) {
      setCurrentPage("login");
      return;
    }
    setCurrentPage("about");
    setEditingId(null);
    setShowAddAnimation(false);
    setHighlightMyNotes(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">Blue Notes App</div>
        <div className="nav-right">
          {accessToken && (
            <>
              <button
                className={`nav-link ${currentPage === "add" ? "active" : ""}`}
                onClick={goToAddPage}
              >
                Add Note
              </button>
              <button
                className={`nav-link ${
                  currentPage === "notes" ? "active" : ""
                } ${highlightMyNotes ? "my-notes-highlight" : ""}`}
                onClick={goToNotesPage}
              >
                My Notes
              </button>
              <button
                className={`nav-link ${
                  currentPage === "about" ? "active" : ""
                }`}
                onClick={goToAboutPage}
              >
                About
              </button>
              <button className="nav-action" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}

          {!accessToken && (
            <>
              <button
                className={`nav-link ${
                  currentPage === "login" ? "active" : ""
                }`}
                onClick={() => {
                  setCurrentPage("login");
                  setAuthError("");
                }}
              >
                Login
              </button>
              <button
                className={`nav-link ${
                  currentPage === "register" ? "active" : ""
                }`}
                onClick={() => {
                  setCurrentPage("register");
                  setAuthError("");
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      {showAddAnimation && accessToken && currentPage === "add" && (
        <div className="note-fly"></div>
      )}

      <div className="page">
        {!accessToken && currentPage === "login" && (
          <div className="panel auth-card">
            <h2>Login</h2>
            <p className="notes-subtitle">
              Sign in to see and manage your notes.
            </p>

            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="auth-input"
            />

            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="auth-input"
            />

            <button className="btn-main" onClick={handleLogin}>
              Login
            </button>

            {authError && <p className="auth-error">{authError}</p>}

            <p className="auth-switch">
              Don’t have an account?
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => {
                  setCurrentPage("register");
                  setAuthError("");
                }}
              >
                Sign Up
              </button>
            </p>
          </div>
        )}

        {!accessToken && currentPage === "register" && (
          <div className="panel auth-card">
            <h2>Sign Up</h2>
            <p className="notes-subtitle">
              Create your account to keep your notes safe.
            </p>

            <input
              type="email"
              placeholder="Email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              className="auth-input"
            />

            <input
              type="password"
              placeholder="Password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              className="auth-input"
            />

            <button className="btn-main" onClick={handleRegister}>
              Sign Up
            </button>

            {authError && <p className="auth-error">{authError}</p>}

            <p className="auth-switch">
              Already have an account?
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => {
                  setCurrentPage("login");
                  setAuthError("");
                }}
              >
                Login
              </button>
            </p>
          </div>
        )}

        {accessToken && currentPage === "add" && (
          <div className="panel add-box">
            <h2>{editingId === null ? "Add Note" : "Edit Note"}</h2>
            <p className="notes-subtitle">
              A gentle space to write down what’s on your mind.
            </p>

            <input
              type="text"
              placeholder="Note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <button className="btn-main" onClick={addNote}>
              {editingId === null ? "Add Note" : "Save Changes"}
            </button>
          </div>
        )}

        {accessToken && currentPage === "notes" && (
          <div className="panel notes-box">
            <h2>My Notes</h2>
            <p className="notes-subtitle">
              Keep all your notes in one cozy place!
            </p>

            <div className="notes-list">
              {notes.length === 0 && (
                <p className="empty-text">
                  
                </p>
              )}

              {notes.map((note) => (
                <div key={note.id} className="note-card">
                  <h4 className="note-title">{note.title}</h4>
                  <p className="note-content">{note.content}</p>

                  <div className="note-card-actions">
                    <button
                      className="btn-main edit-btn"
                      onClick={() => startEdit(note)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-main delete-btn"
                      onClick={() => deleteNote(note.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {accessToken && currentPage === "about" && (
          <div className="panel about-card">
            <h1>About</h1>
            <p>
              This notes app is designed to feel calm, focused, and simple. Use
              it to keep track of ideas, reminders, and anything on your mind.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
