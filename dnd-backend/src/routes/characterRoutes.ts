import express from 'express';
import { supabase } from '../lib/supabase';
import { Character } from '../types';

const router = express.Router();

// Get all characters
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('characters').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get character by ID
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('characters').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Character not found' });
  res.json(data);
});

// Create character
router.post('/', async (req, res) => {
  const char: Character = req.body;
  const { data, error } = await supabase.from('characters').insert([char]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Update character
router.put('/:id', async (req, res) => {
  const { data, error } = await supabase.from('characters').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Delete character
router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('characters').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
