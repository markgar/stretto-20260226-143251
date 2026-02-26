import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProjectMaterialsService } from '../api/generated/services/ProjectMaterialsService';
import { useAuthStore } from '../stores/authStore';

type ProjectLink = { id: string; title: string; url: string };
type ProjectDocument = { id: string; title: string; fileName: string };

const linkSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
});
type LinkFormValues = z.infer<typeof linkSchema>;

type Props = { projectId: string };

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-8 bg-muted rounded animate-pulse" />
      ))}
    </div>
  );
}

function LinksSection({ projectId, isAdmin }: { projectId: string; isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [linkMutationError, setLinkMutationError] = useState<string | null>(null);

  const { data: links = [], isLoading: linksLoading, isError: linksError } = useQuery<ProjectLink[]>({
    queryKey: ['projectLinks', projectId],
    queryFn: () => ProjectMaterialsService.getApiProjectsLinks(projectId),
  });

  const deleteLinkMutation = useMutation({
    mutationFn: (linkId: string) =>
      ProjectMaterialsService.deleteApiProjectsLinks(projectId, linkId),
    onSuccess: () => {
      setLinkMutationError(null);
      queryClient.invalidateQueries({ queryKey: ['projectLinks', projectId] });
    },
    onError: () => setLinkMutationError('Failed to delete link. Please try again.'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
  });

  const addLinkMutation = useMutation({
    mutationFn: (values: LinkFormValues) =>
      ProjectMaterialsService.postApiProjectsLinks(projectId, values),
    onSuccess: () => {
      setLinkMutationError(null);
      reset();
      queryClient.invalidateQueries({ queryKey: ['projectLinks', projectId] });
    },
    onError: () => setLinkMutationError('Failed to add link. Please try again.'),
  });

  const onAddLink = (values: LinkFormValues) => addLinkMutation.mutate(values);

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-3">Links</h2>
      {linkMutationError && (
        <p className="mb-3 text-sm text-destructive">{linkMutationError}</p>
      )}
      {isAdmin && (
        <form onSubmit={handleSubmit(onAddLink)} className="mb-4 flex flex-wrap gap-2 items-start">
          <div className="flex flex-col gap-1">
            <input
              data-testid="link-title-input"
              type="text"
              placeholder="Title"
              {...register('title')}
              className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <input
              data-testid="link-url-input"
              type="text"
              placeholder="URL"
              {...register('url')}
              className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.url && (
              <p className="text-xs text-destructive">{errors.url.message}</p>
            )}
          </div>
          <button
            data-testid="add-link-button"
            type="submit"
            disabled={addLinkMutation.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Add link
          </button>
        </form>
      )}
      {linksLoading ? (
        <LoadingSkeleton />
      ) : linksError ? (
        <p className="text-destructive text-sm">Failed to load links. Please try again.</p>
      ) : links.length === 0 ? (
        <p className="text-muted-foreground">No links yet</p>
      ) : (
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.id} className="flex items-center gap-3">
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                data-testid={`link-${link.id}`}
                className="text-primary hover:underline text-sm"
              >
                {link.title}
              </a>
              {isAdmin && (
                <button
                  data-testid={`delete-link-${link.id}`}
                  disabled={deleteLinkMutation.isPending}
                  onClick={() => {
                    if (window.confirm('Delete this link?')) {
                      deleteLinkMutation.mutate(link.id);
                    }
                  }}
                  className="rounded-md border px-2 py-1 text-xs text-destructive hover:bg-accent disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DocumentsSection({ projectId, isAdmin }: { projectId: string; isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [docMutationError, setDocMutationError] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents = [], isLoading: docsLoading, isError: docsError } = useQuery<ProjectDocument[]>({
    queryKey: ['projectDocuments', projectId],
    queryFn: () => ProjectMaterialsService.getApiProjectsDocuments(projectId),
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) =>
      ProjectMaterialsService.deleteApiProjectsDocuments(projectId, docId),
    onSuccess: () => {
      setDocMutationError(null);
      queryClient.invalidateQueries({ queryKey: ['projectDocuments', projectId] });
    },
    onError: () => setDocMutationError('Failed to delete document. Please try again.'),
  });

  const uploadDocMutation = useMutation({
    mutationFn: ({ file, title }: { file: File; title: string }) =>
      ProjectMaterialsService.postApiProjectsDocuments(projectId, { file, title }),
    onSuccess: () => {
      setDocMutationError(null);
      setUploadTitle('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['projectDocuments', projectId] });
    },
    onError: () => setDocMutationError('Failed to upload document. Please try again.'),
  });

  const handleUpload = () => {
    if (selectedFile && uploadTitle.trim()) {
      uploadDocMutation.mutate({ file: selectedFile, title: uploadTitle.trim() });
    }
  };

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Documents</h2>
      {docMutationError && (
        <p className="mb-3 text-sm text-destructive">{docMutationError}</p>
      )}
      {isAdmin && (
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <input
            data-testid="upload-document-title-input"
            type="text"
            placeholder="Title"
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            data-testid="upload-document-input"
            type="file"
            ref={fileInputRef}
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <button
            data-testid="upload-document-button"
            disabled={uploadDocMutation.isPending || !selectedFile || !uploadTitle.trim()}
            onClick={handleUpload}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Upload
          </button>
        </div>
      )}
      {docsLoading ? (
        <LoadingSkeleton />
      ) : docsError ? (
        <p className="text-destructive text-sm">Failed to load documents. Please try again.</p>
      ) : documents.length === 0 ? (
        <p className="text-muted-foreground">No documents yet</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3">
              <span className="text-sm">{doc.title}</span>
              <a
                href={`/api/projects/${projectId}/documents/${doc.id}/download`}
                download={doc.fileName}
                data-testid={`download-document-${doc.id}`}
                className="text-primary hover:underline text-sm"
              >
                Download
              </a>
              {isAdmin && (
                <button
                  data-testid={`delete-document-${doc.id}`}
                  disabled={deleteDocMutation.isPending}
                  onClick={() => {
                    if (window.confirm('Delete this document?')) {
                      deleteDocMutation.mutate(doc.id);
                    }
                  }}
                  className="rounded-md border px-2 py-1 text-xs text-destructive hover:bg-accent disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function ProjectMaterialsTab({ projectId }: Props) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'Admin';

  return (
    <div>
      <LinksSection projectId={projectId} isAdmin={isAdmin} />
      <DocumentsSection projectId={projectId} isAdmin={isAdmin} />
    </div>
  );
}
