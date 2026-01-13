'use client';

import { useState } from 'react';
import { type InvestorSection } from '@/lib/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, FileText, Globe } from 'lucide-react';

const sectionTypeLabels: Record<string, string> = {
  thesis: 'Thesis',
  criteria: 'Criteria',
  portfolio: 'Portfolio',
  team: 'Team',
  general: 'General',
};

const sectionTypeVariants: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success'
> = {
  thesis: 'default',
  criteria: 'success',
  portfolio: 'secondary',
  team: 'warning',
  general: 'outline',
};

interface EvidenceViewerProps {
  sections: InvestorSection[];
}

interface GroupedSections {
  documentId: string;
  sections: InvestorSection[];
}

export function EvidenceViewer({ sections }: EvidenceViewerProps) {
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());

  // Group sections by document
  const groupedSections = sections.reduce<GroupedSections[]>((acc, section) => {
    const existing = acc.find((g) => g.documentId === section.documentId);
    if (existing) {
      existing.sections.push(section);
    } else {
      acc.push({ documentId: section.documentId, sections: [section] });
    }
    return acc;
  }, []);

  const toggleDoc = (docId: string) => {
    const newExpanded = new Set(expandedDocs);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
    } else {
      newExpanded.add(docId);
    }
    setExpandedDocs(newExpanded);
  };

  if (sections.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          No evidence chunks yet. Run ingestion to extract content.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto">
      {groupedSections.map((group) => {
        const isExpanded = expandedDocs.has(group.documentId);
        const firstSection = group.sections[0];
        const sourceLocator = firstSection.sourceLocator as { url?: string } | null;
        const sourceUrl = sourceLocator?.url;

        return (
          <div key={group.documentId} className="rounded-lg border">
            <Button
              variant="ghost"
              className="w-full justify-between p-4 h-auto"
              onClick={() => toggleDoc(group.documentId)}
            >
              <div className="flex items-center gap-2">
                {sourceUrl ? (
                  <Globe className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-medium">
                  {sourceUrl
                    ? new URL(sourceUrl).hostname
                    : `Document ${group.documentId.slice(0, 8)}`}
                </span>
                <Badge variant="outline" className="ml-2">
                  {group.sections.length} chunks
                </Badge>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {isExpanded && (
              <div className="border-t p-4 space-y-3">
                {group.sections
                  .sort((a, b) => a.chunkIndex - b.chunkIndex)
                  .map((section) => (
                    <div
                      key={section.id}
                      className="rounded border p-3 bg-muted/30"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={
                            sectionTypeVariants[section.sectionType] || 'outline'
                          }
                        >
                          {sectionTypeLabels[section.sectionType] ||
                            section.sectionType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Chunk {section.chunkIndex + 1}
                        </span>
                        {section.title && (
                          <span className="text-sm font-medium truncate">
                            {section.title}
                          </span>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap line-clamp-6">
                        {section.content}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
