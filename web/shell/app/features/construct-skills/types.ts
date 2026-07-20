export interface SkillItem {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  skill_type: string;
  tags: string[];
  type: string;
  file_path: string;
}

export interface SkillTreeNode {
  title: string;
  key: string;
  children?: SkillTreeNode[];
}

export interface SkillDetail {
  skill_name: string;
  file_path: string;
  root_dir: string;
  tree: SkillTreeNode;
  frontmatter: string;
  instructions: string;
  raw_content: string;
  content_type: string;
  metadata: Record<string, string>;
}
