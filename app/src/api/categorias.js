import { supabase } from '../lib/supabaseClient';

export async function listarCategorias() {
  const { data, error } = await supabase.from('categorias_trilha').select('id, rotulo, ordem, ativo').order('ordem');
  if (error) throw error;
  return data;
}

export async function criarCategoria({ id, rotulo, ordem }) {
  const { data, error } = await supabase
    .from('categorias_trilha')
    .insert({ id, rotulo, ordem: ordem ?? 0 })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function atualizarCategoria(id, campos) {
  const { data, error } = await supabase.from('categorias_trilha').update(campos).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
