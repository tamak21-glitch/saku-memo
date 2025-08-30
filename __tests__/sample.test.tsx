import React from 'react';
import { render, screen } from '@testing-library/react';

describe('サンプルテスト', () => {
  it('テストが動作すること', () => {
    render(<div>テストOK</div>);
    expect(screen.getByText('テストOK')).toBeInTheDocument();
  });
});
