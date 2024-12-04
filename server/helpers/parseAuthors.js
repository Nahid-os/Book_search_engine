// Helper function to parse authors field
function parseAuthors(authors) {
    try {
      const authorList = JSON.parse(authors); // Parse authors JSON string
      return authorList.map(author => author.author_id).join(', ') || 'Author'; // Return author IDs or "Author"
    } catch (error) {
      return 'Author'; // Default to "Author" if parsing fails
    }
  }
  
  module.exports = parseAuthors;
  