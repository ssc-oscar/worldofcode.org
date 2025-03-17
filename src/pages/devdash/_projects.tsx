import * as React from 'react';
import {
  CustomContainerComponentProps,
  CustomItemComponentProps
} from 'virtua';

const URL_PREFIXES = {
  bb: 'bitbucket.org',
  'bitbucket.org': 'bitbucket.org',
  gl: 'gitlab.com',
  'gitlab.com': 'gitlab.com',
  'android.googlesource.com': 'android.googlesource.com',
  'bioconductor.org': 'bioconductor.org',
  'drupal.com': 'git.drupal.org',
  'git.eclipse.org': 'git.eclipse.org',
  'git.kernel.org': 'git.kernel.org',
  'git.postgresql.org': 'git.postgresql.org',
  'git.savannah.gnu.org': 'git.savannah.gnu.org',
  'git.zx2c4.com': 'git.zx2c4.com',
  'gitlab.gnome.org': 'gitlab.gnome.org',
  'kde.org': 'anongit.kde.org',
  'repo.or.cz': 'repo.or.cz',
  'salsa.debian.org': 'salsa.debian.org',
  'sourceforge.net': 'git.code.sf.net/p'
} as const;

function getProjectInfo(projectId: string): {
  displayName: string;
  url: string;
} {
  const [prefix, ...bodyParts] = projectId.split('_');
  const body = bodyParts.join('_');

  let platform: string;
  let repoPath: string;

  if (prefix === 'sourceforge.net') {
    platform = URL_PREFIXES[prefix];
    repoPath = body;
  } else if (prefix in URL_PREFIXES && body.includes('_')) {
    platform = URL_PREFIXES[prefix as keyof typeof URL_PREFIXES];
    repoPath = body.replace('_', '/');
  } else if (prefix.includes('.')) {
    platform = prefix;
    repoPath = body.replace('_', '/');
  } else {
    platform = 'github.com';
    repoPath = projectId.replace('_', '/');
  }

  const url = `https://${platform}/${repoPath}`;
  const displayName = projectId.replace(/_/g, '/');

  return { displayName, url };
}

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Virtualized,
  VirtualizedVirtualizer
} from '@/components/ui/virtualized';
import useSWR from 'swr';
import { getProject, MongoProject } from '@/api/mongo';
import { Skeleton } from '@/components/ui/skeleton';

const VirtualizedTableRow = React.forwardRef<
  React.ElementRef<typeof TableRow>,
  CustomItemComponentProps
>((props, ref) => <TableRow ref={ref} {...props} />);
VirtualizedTableRow.displayName = 'VirtualizedTableRow';

const VirtualizedTableBody = React.forwardRef<
  React.ElementRef<typeof TableBody>,
  CustomContainerComponentProps
>((props, ref) => <TableBody ref={ref} className="max-h-96" {...props} />);
VirtualizedTableBody.displayName = 'VirtualizedTableBody';

export function ProjectTableRow({ projectId }: { projectId: string }) {
  const {
    data: project,
    isLoading,
    error
  } = useSWR<MongoProject>(
    `/projects/${projectId}`,
    async () => {
      try {
        return await getProject(projectId);
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    {
      // cache always
      revalidateOnFocus: false,
      //   revalidateOnMount: false,
      revalidateIfStale: false
    }
  );

  const { displayName, url } = getProjectInfo(projectId);

  return (
    <>
      <TableCell className="w-[300px] font-medium">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all hover:underline"
        >
          {displayName}
        </a>
      </TableCell>
      <TableCell className="w-[60px] text-right">
        {isLoading ? (
          <Skeleton className="h-4 w-full" />
        ) : project ? (
          project.NumCommits
        ) : (
          <span className="text-red-500">Error</span>
        )}
      </TableCell>
      <TableCell className="w-[60px] text-right">
        {isLoading ? (
          <Skeleton className="h-4 w-full" />
        ) : project ? (
          project.NumAuthors
        ) : (
          <span className="text-red-500">Error</span>
        )}
      </TableCell>
      <TableCell className="w-[180px] text-right">
        {isLoading ? (
          <Skeleton className="h-4 w-full" />
        ) : project ? (
          <>
            {new Date(project.EarliestCommitDate * 1000).toLocaleDateString()} -{' '}
            {new Date(project.LatestCommitDate * 1000).toLocaleDateString()}
          </>
        ) : (
          <span className="text-red-500">Error</span>
        )}
      </TableCell>
    </>
  );
}

export default function ProjectsTable({
  projectIds
}: {
  projectIds: string[];
}) {
  return (
    <Virtualized className="h-96 overflow-y-auto">
      <table className="w-[600px] table-fixed caption-bottom border-separate border-spacing-0 text-sm">
        <TableHeader className="bg-background sticky top-0 z-20 [&_tr>*]:border-b">
          <TableRow>
            <TableHead className="w-[300px]">Name</TableHead>
            <TableHead className="w-[60px] text-right">Commit</TableHead>
            <TableHead className="w-[60px] text-right">Author</TableHead>
            <TableHead className="w-[180px] text-right">
              Active Period
            </TableHead>
          </TableRow>
        </TableHeader>
        <VirtualizedVirtualizer
          as={VirtualizedTableBody}
          item={VirtualizedTableRow}
          startMargin={48}
        >
          {projectIds.map((projectId) => (
            <ProjectTableRow key={projectId} projectId={projectId} />
          ))}
        </VirtualizedVirtualizer>
      </table>
    </Virtualized>
  );
}
