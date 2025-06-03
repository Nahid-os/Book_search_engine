# Book Recommendation and Search Engine 📚✨

A full-stack web application for discovering, searching, and managing books, featuring personalized recommendations and a robust search engine.

## Prerequisites

Before you begin, ensure you have the following installed:
*   **Node.js:** (v18.x or later recommended)
*   **npm** or **Yarn**
*   **MongoDB:** Ensure it's running.
*   **Elasticsearch:** Ensure it's running (typically on port 9200).
*   **Python 3:** (For recommendation data processing)
*   **Jupyter Notebook/Lab:** (For recommendation data processing)
*   **Python Libraries:** `pymongo`, `numpy`, `scipy`, `scikit-learn`, `faiss-cpu` (or `faiss-gpu`). Install via pip:
    ```bash
    pip install pymongo numpy scipy scikit-learn faiss-cpu
    ```

## Setup & Running

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/Book_Recommendation_And_Search_Engine.git
    cd Book_Recommendation_And_Search_Engine
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the project root:
    ```env
    PORT=3001
    MONGODB_URI=mongodb://127.0.0.1:27017
    DATABASE_NAME=book_database
    SESSION_SECRET=your_super_strong_session_secret_here_please_change_me
    CORS_ORIGIN=http://localhost:3000
    ```
    *   **Important:** Change `SESSION_SECRET` to a strong, unique string.

4.  **Database & Search Engine Setup:**
    *   **MongoDB Data:** Populate your MongoDB `books`, `authors`, and `goodreads_interactions` collections. (This process depends on your data source).
    *   **Elasticsearch Sync:** Run `node syncBooks.js` to index your MongoDB `books` data into Elasticsearch.
        ```bash
        node syncBooks.js
        ```
    *   **Compute Similarities (for Recommendations):**
        Run the `compute_cosine_similarity.ipynb` Jupyter Notebook. Ensure `MONGO_URI` in the notebook points to your database.

5.  **Run the Application:**

    *   **Start Backend Server (Express.js):**
        In one terminal:
        ```bash
        node server/server.js
        ```
        (Backend will run on `http://localhost:3001` by default)

    *   **Start Frontend Server (Next.js):**
        In another terminal:
        ```bash
        npm run dev
        ```
        (Frontend will run on `http://localhost:3000` by default)

    Open [http://localhost:3000](http://localhost:3000) in your browser.

---
