const API_URL = 'http://localhost:3000/api/posts'; // relative path now

async function fetchPosts() {
  const res = await fetch(API_URL);
  const posts = await res.json();
  const container = document.getElementById('posts');
  container.innerHTML = '';

  posts.forEach(post => {
    const div = document.createElement('div');
    div.className = 'post';
    div.innerHTML = `
      <strong>${post.title}</strong><br/>
      <p>${post.body}</p>
      <button onclick="editPost('${post.id}', '${post.title}', \`${post.body}\`)">Edit</button>
      <button onclick="deletePost('${post.id}')">Delete</button>
    `;
    container.appendChild(div);
  });
}

async function createPost() {
  const title = document.getElementById('title').value;
  const body = document.getElementById('body').value;
  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body }),
  });
  document.getElementById('title').value = '';
  document.getElementById('body').value = '';
  fetchPosts();
}

async function deletePost(id) {
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  fetchPosts();
}

function editPost(id, oldTitle, oldBody) {
  const title = prompt('Edit title:', oldTitle);
  const body = prompt('Edit body:', oldBody);
  if (title !== null && body !== null) {
    updatePost(id, title, body);
  }
}

async function updatePost(id, title, body) {
  await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body }),
  });
  fetchPosts();
}

// Initial load
fetchPosts();
