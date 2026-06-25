import { formatDateTime } from '../utils/format';
import type { NewsItem } from '../types';

interface NewsListProps {
  news: NewsItem[];
  loading?: boolean;
}

export default function NewsList({ news, loading }: NewsListProps) {
  if (loading) {
    return <p className="text-center text-sm text-slate-400 py-8">뉴스 불러오는 중...</p>;
  }

  if (news.length === 0) {
    return <p className="text-center text-sm text-slate-400 py-8">관련 뉴스가 없습니다.</p>;
  }

  return (
    <ul className="space-y-3">
      {news.map((item, i) => (
        <li key={i}>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3 transition-colors hover:border-slate-700"
          >
            {item.thumbnail && (
              <img
                src={item.thumbnail}
                alt=""
                className="h-16 w-16 shrink-0 rounded object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-medium leading-snug">{item.title}</p>
              <p className="mt-1 text-xs text-slate-400">
                {item.publisher}
                {item.publishedAt && ` · ${formatDateTime(item.publishedAt)}`}
              </p>
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}
