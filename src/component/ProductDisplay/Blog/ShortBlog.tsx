import { BlogPost } from "@/types/blog";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type BlogProps = {
  blog: BlogPost;
};

const ShortBlog = ({ blog }: BlogProps) => {
  return (
    <div className="my-10 p-6 bg-linear-to-r from-blue-50 to-gray-50 border border-blue-100 rounded-lg">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h4 className="text-xl font-light mb-3">{blog.title}</h4>
          <div className="text-sm text-gray-600 mb-4 line-clamp-3 prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {blog?.content?.slice(0, 400)}
            </ReactMarkdown>
          </div>

          <Link
            href={`/blogs/${blog.slug}`}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Read full article
            <ChevronRight className="ml-1 w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ShortBlog;
