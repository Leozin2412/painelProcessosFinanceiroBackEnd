import { authenticateUser } from '../repository/loginL.js';

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const data = await authenticateUser(email, password);

        return res.status(200).json({
            message: 'Login successful',
            session: data.session,
            user: data.user
        });
    } catch (error) {
        console.error('Login error:', error.message);
        // Supabase often returns 'Invalid login credentials' error
        return res.status(401).json({ error: 'Invalid email or password' });
    }
};
