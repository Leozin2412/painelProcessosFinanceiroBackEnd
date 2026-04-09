import { getAllProcesses, getFilterOptions, getSuggestions } from '../repository/processosL.js';

const getProcesses = async (req, res) => {
  try {
    // Extract req.query and pass it to the repository
    const filters = req.query;
    const data = await getAllProcesses(filters);
    
    // Return 200 with data
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in getProcesses:', error);
    // Return 400/500 with errors
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

const getOptions = async (req, res) => {
  try {
    // Call the repository for distinct options
    const data = await getFilterOptions();
    
    // Return the compiled JSON arrays
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in getOptions:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

const getLiveSuggestions = async (req, res) => {
  try {
    const { campo, termo } = req.query;

    // Validate that req.query.campo and req.query.termo exist
    if (!campo || !termo) {
      return res.status(400).json({ error: 'Missing required query parameters: "campo" and "termo"' });
    }

    // Call the repository and return the suggestions
    const data = await getSuggestions(campo, termo);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in getLiveSuggestions:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export default { getProcesses, getOptions, getLiveSuggestions };
