import { getAllProcesses, getFilterOptions, getSuggestions, upsertProcessStatus } from '../repository/processosL.js';

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
    // Fetch dynamic filter options from the database view
    const dbOptions = await getFilterOptions();

    // Hardcoded business workflow enum for status_bh.
    // null MUST be first — it acts as the "Clear Status" sentinel for the front-end.
    const statusBhOptions = [
      null,
      'ok',
      'corrigir',
      'pedido de autorização',
      'revisado',
      'nf emitida'
    ];

    // Merge dynamic options with the injected status_bh enum
    return res.status(200).json({ ...dbOptions, status_bh: statusBhOptions });
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

const updateProcessStatus = async (req, res) => {
  try {
    const { codigo_sinistro } = req.params;
    const { status_bh, obs } = req.body;

    // Validate that at least one field is provided
    if (status_bh === undefined && obs === undefined) {
      return res.status(400).json({
        error: 'Bad Request: at least one field ("status_bh" or "obs") must be provided in the request body.'
      });
    }

    // Build the updates object with only the provided fields
    const updates = {};
    if (status_bh !== undefined) updates.status_bh = status_bh;
    if (obs !== undefined) updates.obs = obs;

    const data = await upsertProcessStatus(codigo_sinistro, updates);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in updateProcessStatus:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export { getProcesses, getOptions, getLiveSuggestions, updateProcessStatus };
