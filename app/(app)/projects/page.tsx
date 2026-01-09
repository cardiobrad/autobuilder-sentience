'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Project {
  id: string;
  name: string;
  description?: string;
  visibility: 'private' | 'public' | 'unlisted';
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectVisibility, setNewProjectVisibility] = useState<'private' | 'public' | 'unlisted'>('private');
  const router = useRouter();

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to fetch projects');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Network error or unexpected issue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newProjectName.trim()) {
      setError('Project name cannot be empty.');
      return;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription,
          visibility: newProjectVisibility,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setProjects([...projects, data]);
        setNewProjectName('');
        setNewProjectDescription('');
        setNewProjectVisibility('private');
      } else {
        setError(data.error || 'Failed to create project.');
        if (data.details) {
            setError(data.details.map((d: any) => d.message).join(' | ')); // eslint-disable-line @typescript-eslint/no-explicit-any
        }
      }
    } catch (err) {
      console.error('Create project error:', err);
      setError('An unexpected error occurred.');
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading projects...</div>;
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="flex justify-between items-center py-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-800">Your Projects</h1>
        <Button onClick={() => router.push('/app/dashboard')} className="bg-gray-500 hover:bg-gray-600 text-white">
          Back to Dashboard
        </Button>
      </header>
      <main className="mt-8">
        <section className="mb-8 p-6 bg-white shadow-md rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">Project Name</label>
              <Input
                id="projectName"
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="projectDescription"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              ></textarea>
            </div>
            <div>
              <label htmlFor="projectVisibility" className="block text-sm font-medium text-gray-700">Visibility</label>
              <select
                id="projectVisibility"
                value={newProjectVisibility}
                onChange={(e) => setNewProjectVisibility(e.target.value as 'private' | 'public' | 'unlisted')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
              </select>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
              Create Project
            </Button>
          </form>
        </section>

        <section className="p-6 bg-white shadow-md rounded-lg">
          <h2 className="text-xl font-semibold mb-4">My Projects</h2>
          {projects.length === 0 ? (
            <p className="text-gray-600">No projects found. Create one above!</p>
          ) : (
            <ul className="space-y-4">
              {projects.map((project) => (
                <li key={project.id} className="p-4 border border-gray-200 rounded-md shadow-sm">
                  <h3 className="text-lg font-medium text-gray-800">{project.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{project.description || 'No description'}</p>
                  <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {project.visibility}
                  </span>
                  {/* Add edit/delete buttons here in a real app */}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
