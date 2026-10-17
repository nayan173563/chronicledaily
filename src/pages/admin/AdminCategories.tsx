import React, { useState } from 'react';
import { Category } from '../../types';
import { api } from '../../services/api';
import { useWebsite } from '../../context/WebsiteContext';
import { Plus, Edit2, Trash2, Layers, Check } from 'lucide-react';

export const AdminCategories: React.FC = () => {
  const { categories, refreshCategories, toast, confirm } = useWebsite();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#0f172a');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setColor(cat.color || '#0f172a');
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setColor('#0f172a');
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, {
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
          color,
        });
      } else {
        await api.createCategory({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
          color,
        });
      }
      toast.success(editingCategory ? `Category "${name}" updated` : `Category "${name}" created`);
      await refreshCategories();
      cancelEdit();
    } catch (err: any) {
      toast.error(`Category action failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string, catName: string) => {
    confirm({
      title: 'Delete Category',
      message: `Delete category "${catName}"? This action cannot be undone.`,
      confirmLabel: 'Delete Desk',
      onConfirm: async () => {
        try {
          await api.deleteCategory(id);
          await refreshCategories();
          toast.success(`Category "${catName}" deleted`);
        } catch (err: any) {
          toast.error(`Delete failed: ${err.message}`);
        }
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-5">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Editorial Desks &amp; Categories
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Organize journalism across National, International, Politics, Sports, Entertainment, Tech, Drama, and Custom Desks
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form (5 cols) */}
        <div className="lg:col-span-5 bg-neutral-950 border border-neutral-800 rounded-xl p-5">
          <h3 className="font-serif font-bold text-base text-white mb-4">
            {editingCategory ? 'Edit Desk / Category' : 'Create New Category'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Category Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Science & Space"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                URL Slug *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. science-space"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Description
              </label>
              <textarea
                rows={2}
                placeholder="Brief editorial scope..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Accent Badge Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-8 bg-neutral-900 border border-neutral-700 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-28 px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
              {editingCategory && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Existing Categories Table (7 cols) */}
        <div className="lg:col-span-7 bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-white">
              Active Desks ({categories.length})
            </h3>
            <span className="text-[11px] text-neutral-500">Live on Navigation</span>
          </div>

          <div className="divide-y divide-neutral-900">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-900/40">
                <div className="min-w-0 flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || '#0f172a' }}
                  />
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {cat.name}
                    </h4>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      /category/{cat.slug} · {cat.post_count || 0} posts
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(cat)}
                    className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
